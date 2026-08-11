import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(6).max(72),
});

/**
 * Accounts are created with email/password only, so `auth.users.phone` is NULL
 * and Supabase phone sign-in can never match. This resolves the phone number
 * (stored on public.profiles) to the account email server-side, then performs
 * the password sign-in. The password is always required, so no email is ever
 * disclosed to the caller.
 */
export const signInWithPhone = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const digits = data.phone.replace(/\D/g, "");
    const local = digits.startsWith("233") ? digits.slice(3) : digits.replace(/^0/, "");
    const candidates = [`+233${local}`, `233${local}`, `0${local}`, local];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, phone")
      .in("phone", candidates)
      .limit(2);

    const profile = profiles?.[0];
    if (!profile) return { error: "Invalid login credentials" as const };

    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    const email = userRes?.user?.email;
    if (!email) return { error: "Invalid login credentials" as const };

    const anon = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data: signIn, error } = await anon.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (error || !signIn.session) return { error: "Invalid login credentials" as const };

    return {
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    };
  });
