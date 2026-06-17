import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }).partial(),
  head: () => ({
    meta: [
      { title: "Sign in or Sign up — AutoFie" },
      { name: "description", content: "Sign in or create your AutoFie account with email or phone to post listings, message dealers and save vehicles across Ghana." },
      { property: "og:title", content: "Sign in or Sign up — AutoFie" },
      { property: "og:description", content: "Create your AutoFie account to post listings, message dealers and save vehicles across Ghana." },
      { property: "og:url", content: "https://autofie.com/auth" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://autofie.com/auth" }],
  }),
  component: AuthPage,
});

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233")) return "+" + digits;
  if (digits.startsWith("0")) return "+233" + digits.slice(1);
  return "+233" + digits;
}

const signInSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or phone"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const registerSchema = z.object({
  first_name: z.string().trim().min(1, "First name required").max(50),
  last_name: z.string().trim().min(1, "Last name required").max(50),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().regex(/^\d{8,15}$/, "Digits only, 8–15 numbers"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [siId, setSiId] = useState("");
  const [siPwd, setSiPwd] = useState("");

  const [rFirst, setRFirst] = useState("");
  const [rLast, setRLast] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rPwd, setRPwd] = useState("");

  useEffect(() => {
    if (user) navigate({ to: (search.redirect as any) || "/" });
  }, [user, navigate, search.redirect]);

  const doSignIn = async () => {
    const parsed = signInSchema.safeParse({ identifier: siId, password: siPwd });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const id = parsed.data.identifier.trim();
    const isEmail = id.includes("@");
    const creds = isEmail
      ? { email: id, password: parsed.data.password }
      : { phone: normalisePhone(id), password: parsed.data.password };
    const { error } = await supabase.auth.signInWithPassword(creds as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
  };

  const doRegister = async () => {
    const parsed = registerSchema.safeParse({
      first_name: rFirst, last_name: rLast, email: rEmail, phone: rPhone, password: rPwd,
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
    toast.success("Account created — check your email to confirm, then sign in.");
  };

  const signInGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message || "Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <Link to="/" className="mb-6 block text-2xl font-extrabold text-primary">AutoFie</Link>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="register">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="si-id">Email or phone</Label>
              <Input
                id="si-id"
                value={siId}
                onChange={(e) => setSiId(e.target.value)}
                placeholder="you@email.com or 024 123 4567"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="si-pwd">Password</Label>
              <div className="relative">
                <Input
                  id="si-pwd"
                  type={showPwd ? "text" : "password"}
                  value={siPwd}
                  onChange={(e) => setSiPwd(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={doSignIn} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
            </div>
            <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={signInGoogle}>
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12s4.2 9.3 9.3 9.3c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.6H12z"/>
              </svg>
              Continue with Google
            </Button>
          </TabsContent>

          <TabsContent value="register" className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
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
              <Label htmlFor="r-email">Email</Label>
              <Input id="r-email" type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-phone">Phone</Label>
              <div className="flex items-center gap-2">
                <span className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">🇬🇭 +233</span>
                <Input id="r-phone" inputMode="tel" value={rPhone} onChange={(e) => setRPhone(e.target.value)} placeholder="24 123 4567" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-pwd">Password</Label>
              <Input id="r-pwd" type="password" value={rPwd} onChange={(e) => setRPwd(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
            </div>
            <Button onClick={doRegister} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              You can sign in with either your email or phone and this password.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
