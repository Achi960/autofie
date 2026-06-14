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
