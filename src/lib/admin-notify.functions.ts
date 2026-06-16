import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Records an in-app admin notification (replaces the previous Africa's Talking SMS path,
 * since AT does not support WhatsApp in Ghana and SMS delivery was unreliable).
 * Admins see these on the /admin/notifications page.
 */
export const notifyAdminWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { message: string; title?: string; link?: string }) => {
    if (!data?.message || typeof data.message !== "string") throw new Error("message required");
    if (data.message.length > 800) throw new Error("message too long");
    if (data.title && (typeof data.title !== "string" || data.title.length > 200)) {
      throw new Error("invalid title");
    }
    // Restrict link to safe in-app relative paths to prevent phishing links being
    // injected into the admin notification feed by authenticated users.
    if (data.link != null) {
      if (typeof data.link !== "string" || data.link.length > 300) {
        throw new Error("invalid link");
      }
      const trimmed = data.link.trim();
      if (trimmed && !/^\/[A-Za-z0-9\-._~!$&'()*+,;=:@/%?#]*$/.test(trimmed)) {
        throw new Error("link must be a relative in-app path starting with '/'");
      }
    }
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("admin_notifications").insert({
        title: data.title ?? "New activity",
        message: data.message,
        link: data.link ?? null,
      });
      if (error) {
        console.error("[admin-notify] insert error", error);
        return { sent: false, reason: "db_error" };
      }
      return { sent: true };
    } catch (e) {
      console.error("[admin-notify] exception", e);
      return { sent: false, reason: "exception" };
    }
  });
