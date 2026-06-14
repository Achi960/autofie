import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_WHATSAPP = "+233245209130";
const GATEWAY = "https://connector-gateway.lovable.dev/twilio";

/**
 * Sends a WhatsApp message to the admin via the Twilio connector gateway.
 * Requires the caller to be signed in; gracefully no-ops if Twilio isn't linked.
 */
export const notifyAdminWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { message: string }) => {
    if (!data?.message || typeof data.message !== "string") throw new Error("message required");
    if (data.message.length > 1500) throw new Error("message too long");
    return data;
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const twilioKey = process.env.TWILIO_API_KEY;
    const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. +14155238886 (Twilio sandbox)
    if (!lovableKey || !twilioKey || !from) {
      console.warn("[admin-notify] Twilio not configured; skipping WhatsApp alert");
      return { sent: false, reason: "twilio_not_configured" };
    }
    try {
      const body = new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:${ADMIN_WHATSAPP}`,
        Body: data.message,
      });
      const res = await fetch(`${GATEWAY}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": twilioKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`[admin-notify] Twilio ${res.status}: ${t}`);
        return { sent: false, reason: "twilio_error" };
      }
      return { sent: true };
    } catch (e) {
      console.error("[admin-notify] error", e);
      return { sent: false, reason: "exception" };
    }
  });
