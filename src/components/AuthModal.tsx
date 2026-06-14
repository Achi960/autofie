import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Phone } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.1 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233")) return "+" + digits;
  if (digits.startsWith("0")) return "+233" + digits.slice(1);
  return "+233" + digits;
}

type Step = "choose" | "phone" | "otp";

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneE164, setPhoneE164] = useState("");

  const reset = () => {
    setStep("choose");
    setOtp("");
    setPhone("");
    setName("");
  };

  const signInGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message || "Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    toast.success("Signed in");
    onOpenChange(false);
    reset();
    onSuccess?.();
    setLoading(false);
  };

  const sendOtp = async () => {
    if (!phone) { toast.error("Enter your phone number"); return; }
    setLoading(true);
    const e164 = normalisePhone(phone);
    setPhoneE164(e164);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { data: { full_name: name.trim() || null } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("SMS")
        ? "SMS provider not configured. Enable Twilio/MessageBird in the backend auth settings."
        : error.message);
      return;
    }
    toast.success("Code sent. Check your phone.");
    setStep("otp");
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: phoneE164, token: otp, type: "sms" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
    onOpenChange(false);
    reset();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            {step !== "choose" && (
              <button
                type="button"
                onClick={() => setStep(step === "otp" ? "phone" : "choose")}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {step === "choose" && "Sign in"}
            {step === "phone" && "Sign in with phone"}
            {step === "otp" && "Enter the 6-digit code"}
          </DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full justify-center gap-3 text-base font-semibold"
              disabled={loading}
              onClick={signInGoogle}
            >
              <GoogleIcon /> Google
            </Button>

            <Button
              type="button"
              className="h-12 w-full justify-center gap-2 bg-success text-base font-semibold text-success-foreground hover:bg-success/90"
              onClick={() => setStep("phone")}
            >
              <Phone className="h-5 w-5" /> Phone number
            </Button>

            <p className="pt-2 text-center text-xs text-muted-foreground">
              By continuing you agree to the <span className="font-medium text-foreground">Policy and Rules</span>
            </p>
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name (new users)</Label>
              <Input id="name" placeholder="Kwame Mensah" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex items-center gap-2">
                <span className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">🇬🇭 +233</span>
                <Input id="phone" inputMode="tel" placeholder="24 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} />
              </div>
            </div>
            <Button
              onClick={sendOtp}
              disabled={loading}
              className="h-12 w-full bg-success text-base font-semibold text-success-foreground hover:bg-success/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send code
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Sent to {phoneE164}. Valid for 5 minutes.</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="h-12 w-full bg-success text-base font-semibold text-success-foreground hover:bg-success/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verify
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
