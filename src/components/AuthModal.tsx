import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12s4.2 9.3 9.3 9.3c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233")) return "+" + digits;
  if (digits.startsWith("0")) return "+233" + digits.slice(1);
  return "+233" + digits;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneE164, setPhoneE164] = useState("");

  const reset = () => {
    setStep("phone");
    setOtp("");
  };

  const sendOtp = async () => {
    if (!phone) {
      toast.error("Enter your phone number");
      return;
    }
    setLoading(true);
    const e164 = normalisePhone(phone);
    setPhoneE164(e164);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: {
        data: { full_name: name.trim() || null },
      },
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
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    onOpenChange(false);
    reset();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === "phone" ? "Sign in to Autofie" : "Enter the 6-digit code"}</DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "We'll text you a code. No password needed."
              : `Sent to ${phoneE164}. Valid for 5 minutes.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
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
            <Button onClick={sendOtp} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
            <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verify
            </Button>
            <Button variant="ghost" onClick={() => setStep("phone")} className="w-full">
              Use a different number
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
