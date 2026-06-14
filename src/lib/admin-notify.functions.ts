import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_PHONE = "+233245209130";

/**
 * Sends an SMS to the admin via Africa's Talking.
 * Uses sandbox automatically when AT_USERNAME === "sandbox".
 * Gracefully no-ops if credentials aren't configured.
 */
export const notifyAdminWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { message: string }) => {
    if (!data?.message || typeof data.message !== "string") throw new Error("message required");
    if (data.message.length > 800) throw new Error("message too long");
    return data;
  })
  .handler(async ({ data }) => {
    const username = process.env.AT_USERNAME;
    const apiKey = process.env.AT_API_KEY;
    const senderId = process.env.AT_SENDER_ID || undefined;
    if (!username || !apiKey) {
      console.warn("[admin-notify] Africa's Talking not configured; skipping SMS");
      return { sent: false, reason: "at_not_configured" };
    }
    const host =
      username === "sandbox" ? "https://api.sandbox.africastalking.com" : "https://api.africastalking.com";
    try {
      const body = new URLSearchParams({
        username,
        to: ADMIN_PHONE,
        message: data.message,
      });
      if (senderId) body.set("from", senderId);
      const res = await fetch(`${host}/version1/messaging`, {
        method: "POST",
        headers: {
          apiKey,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const text = await res.text();
      if (!res.ok) {
        console.error(`[admin-notify] AT ${res.status}: ${text}`);
        return { sent: false, reason: "at_error" };
      }
      return { sent: true };
    } catch (e) {
      console.error("[admin-notify] error", e);
      return { sent: false, reason: "exception" };
    }
  });
