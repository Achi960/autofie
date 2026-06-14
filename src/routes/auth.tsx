import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }).partial(),
  head: () => ({
    meta: [
      { title: "Sign in — Autofie" },
      { name: "description", content: "Sign in to Autofie with your phone number." },
    ],
  }),
  component: AuthPage,
});

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233")) return "+" + digits;
  if (digits.startsWith("0")) return "+233" + digits.slice(1);
  return "+233" + digits;
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: (search.redirect as any) || "/" });
  }, [user, navigate, search.redirect]);

  const send = async () => {
    if (!phone) { toast.error("Enter your phone number"); return; }
    setLoading(true);
    const e164 = normalisePhone(phone);
    setPhoneE164(e164);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164, options: { data: { full_name: name.trim() || null } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("SMS")
        ? "SMS provider not configured. Enable Twilio/MessageBird in backend auth settings."
        : error.message);
      return;
    }
    toast.success("Code sent");
    setStep("otp");
  };

  const verify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: phoneE164, token: otp, type: "sms" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block text-2xl font-extrabold text-primary">Autofie</Link>
        <h1 className="text-xl font-bold">{step === "phone" ? "Sign in" : "Verify code"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "phone" ? "We'll text you a 6-digit code." : `Sent to ${phoneE164}`}
        </p>

        {step === "phone" ? (
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name (new users)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kwame Mensah" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <div className="flex items-center gap-2">
                <span className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">🇬🇭 +233</span>
                <Input id="phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="24 123 4567" />
              </div>
            </div>
            <Button onClick={send} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send code
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={verify} disabled={loading || otp.length !== 6} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verify
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("phone")}>Use a different number</Button>
          </div>
        )}
      </div>
    </div>
  );
}
