import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialStep?: "choose" | "signin" | "register";
}

type Step = "choose" | "signin" | "register";

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

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  first_name: z.string().trim().min(1, "First name required").max(50),
  last_name: z.string().trim().min(1, "Last name required").max(50),
  phone: z.string().regex(/^\d{8,15}$/, "Digits only, 8–15 numbers"),
  agree: z.literal(true, { message: "You must agree to the rules" }),
});

export function AuthModal({ open, onOpenChange, onSuccess, initialStep = "choose" }: AuthModalProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // sign-in
  const [siEmail, setSiEmail] = useState("");
  const [siPwd, setSiPwd] = useState("");

  // register
  const [rEmail, setREmail] = useState("");
  const [rPwd, setRPwd] = useState("");
  const [rFirst, setRFirst] = useState("");
  const [rLast, setRLast] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rAgree, setRAgree] = useState(false);

  const reset = () => {
    setStep("choose");
    setSiEmail(""); setSiPwd("");
    setREmail(""); setRPwd(""); setRFirst(""); setRLast(""); setRPhone(""); setRAgree(false);
    setShowPwd(false);
  };

  const close = () => { onOpenChange(false); reset(); onSuccess?.(); };

  const signInGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message || "Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    toast.success("Signed in"); close(); setLoading(false);
  };

  const doSignIn = async () => {
    const parsed = signInSchema.safeParse({ email: siEmail, password: siPwd });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in"); close();
  };

  const doRegister = async () => {
    const parsed = registerSchema.safeParse({
      email: rEmail, password: rPwd, first_name: rFirst, last_name: rLast, phone: rPhone, agree: rAgree,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const phoneE164 = normalisePhone(parsed.data.phone);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: parsed.data.first_name,
          last_name: parsed.data.last_name,
          full_name: `${parsed.data.first_name} ${parsed.data.last_name}`,
          phone: phoneE164,
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — check your email to confirm");
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            {step !== "choose" && (
              <button type="button" onClick={() => setStep("choose")} className="rounded-full p-1 hover:bg-muted" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {step === "choose" && "Sign in"}
            {step === "signin" && "Sign in via email"}
            {step === "register" && "Register via email and phone"}
          </DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-3">
            <Button type="button" variant="outline" className="h-12 w-full justify-center gap-3 text-base font-semibold" disabled={loading} onClick={signInGoogle}>
              <GoogleIcon /> Google
            </Button>
            <Button type="button" className="h-12 w-full bg-success text-base font-semibold text-success-foreground hover:bg-success/90" onClick={() => setStep("signin")}>
              E-mail or phone
            </Button>
            <p className="pt-1 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button type="button" onClick={() => setStep("register")} className="font-semibold text-success hover:underline">
                Registration
              </button>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to the <span className="font-medium text-foreground">Policy and Rules</span>
            </p>
          </div>
        )}

        {step === "signin" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="si-email">Email</Label>
              <Input id="si-email" type="email" autoComplete="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="si-pwd">Password</Label>
              <div className="relative">
                <Input id="si-pwd" type={showPwd ? "text" : "password"} autoComplete="current-password" value={siPwd} onChange={(e) => setSiPwd(e.target.value)} maxLength={72} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={doSignIn} disabled={loading} className="h-12 w-full bg-success text-base font-semibold text-success-foreground hover:bg-success/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button type="button" onClick={() => setStep("register")} className="font-semibold text-success hover:underline">Registration</button>
            </p>
          </div>
        )}

        {step === "register" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-email">Enter email</Label>
              <Input id="r-email" type="email" autoComplete="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-pwd">Password</Label>
              <div className="relative">
                <Input id="r-pwd" type={showPwd ? "text" : "password"} autoComplete="new-password" value={rPwd} onChange={(e) => setRPwd(e.target.value)} maxLength={72} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Never disclose your Autofie password to anyone.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-first">First name</Label>
                <Input id="r-first" value={rFirst} onChange={(e) => setRFirst(e.target.value)} maxLength={50} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-last">Last name</Label>
                <Input id="r-last" value={rLast} onChange={(e) => setRLast(e.target.value)} maxLength={50} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-phone">Phone (digits only)</Label>
              <div className="flex items-center gap-2">
                <span className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">🇬🇭 +233</span>
                <Input id="r-phone" inputMode="numeric" value={rPhone} onChange={(e) => setRPhone(e.target.value.replace(/\D/g, ""))} placeholder="241234567" maxLength={15} />
              </div>
            </div>
            <label className="flex items-start gap-2 pt-1 text-sm">
              <Checkbox checked={rAgree} onCheckedChange={(c) => setRAgree(c === true)} className="mt-0.5" />
              <span>I agree with the <span className="font-medium">rules</span></span>
            </label>
            <Button onClick={doRegister} disabled={loading} className="h-12 w-full bg-success text-base font-semibold text-success-foreground hover:bg-success/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Register
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => setStep("signin")} className="font-semibold text-success hover:underline">Sign in</button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
