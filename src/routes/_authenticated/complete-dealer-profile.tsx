import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGIONS, ALL_REGIONS } from "@/lib/ghana";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/complete-dealer-profile")({
  component: DealerProfileForm,
});

function DealerProfileForm() {
  const { user, refreshRoles, isPendingDealer, isVerifiedDealer } = useAuth();
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [ghanaCardNumber, setGhanaCardNumber] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("dealer_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data);
          setBusinessName(data.business_name || "");
          setRegion(data.region || "");
          setDistrict(data.district || "");
          setPhone(data.phone || "");
          setGhanaCardNumber(data.ghana_card_number || "");
        }
      });
  }, [user]);

  const districts = region ? REGIONS[region] ?? [] : [];

  const submit = async () => {
    if (!user) return;
    if (!businessName || !region || !district || !phone || !ghanaCardNumber) {
      toast.error("Fill in all fields"); return;
    }
    if (!existing && (!idFront || !idBack || !selfie)) {
      toast.error("Upload all three photos"); return;
    }
    setSubmitting(true);
    try {
      const upload = async (f: File | null, name: string) => {
        if (!f) return null;
        const ext = f.name.split(".").pop() || "jpg";
        const path = `${user.id}/${name}-${Date.now()}.${ext}`;
        await uploadFile("dealer-docs", path, f);
        return path;
      };
      const id_front_url = idFront ? await upload(idFront, "id-front") : existing?.id_front_url;
      const id_back_url = idBack ? await upload(idBack, "id-back") : existing?.id_back_url;
      const selfie_url = selfie ? await upload(selfie, "selfie") : existing?.selfie_url;

      const payload = {
        user_id: user.id,
        business_name: businessName, region, district, phone,
        ghana_card_number: ghanaCardNumber,
        id_front_url, id_back_url, selfie_url,
        status: "pending" as const,
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("dealer_profiles").upsert(payload);
      if (error) throw error;

      // mark role as pending
      await supabase.from("user_roles").upsert({ user_id: user.id, role: "dealer_pending" }, { onConflict: "user_id,role" });
      await refreshRoles();
      toast.success("Application submitted! An admin will review it shortly.");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Dealer verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified dealers can post unlimited listings. Verification is manual and usually takes under 24 hours.
        </p>

        {isVerifiedDealer && (
          <StatusBanner variant="success" icon={<CheckCircle2 className="h-5 w-5" />}
            title="You're a verified dealer"
            description="You can post listings any time." />
        )}
        {isPendingDealer && !isVerifiedDealer && (
          <StatusBanner variant="info" icon={<Clock className="h-5 w-5" />}
            title="Application under review"
            description="An admin will approve your account soon. You can update the details below if needed." />
        )}
        {existing?.status === "rejected" && (
          <StatusBanner variant="error"
            title="Application rejected"
            description={existing.rejection_reason || "Please review and resubmit."} />
        )}

        <div className="mt-6 space-y-4 rounded-xl border bg-card p-6">
          <Field label="Business name"><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={120} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Region">
              <Select value={region} onValueChange={(v) => { setRegion(v); setDistrict(""); }}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>{ALL_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="District">
              <Select value={district} onValueChange={setDistrict} disabled={!region}>
                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Business phone"><Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></Field>
          <Field label="Ghana Card number">
            <Input value={ghanaCardNumber} onChange={(e) => setGhanaCardNumber(e.target.value.toUpperCase())} placeholder="GHA-000000000-0" maxLength={20} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <FileField label="ID front" file={idFront} onChange={setIdFront} existing={existing?.id_front_url} />
            <FileField label="ID back" file={idBack} onChange={setIdBack} existing={existing?.id_back_url} />
            <FileField label="Selfie with ID" file={selfie} onChange={setSelfie} existing={existing?.selfie_url} />
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existing ? "Update application" : "Submit application"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function FileField({ label, file, onChange, existing }: { label: string; file: File | null; onChange: (f: File | null) => void; existing?: string | null }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed bg-muted/30 p-2 text-center text-xs text-muted-foreground hover:border-primary">
        <Upload className="h-5 w-5" />
        <span className="line-clamp-2">{file?.name || (existing ? "Uploaded ✓" : "Tap to upload")}</span>
        <input type="file" accept="image/*" capture="environment" className="hidden"
               onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}

function StatusBanner({ variant, icon, title, description }: { variant: "success" | "info" | "error"; icon?: React.ReactNode; title: string; description: string }) {
  const cls = variant === "success" ? "border-success/30 bg-success/10 text-success"
    : variant === "error" ? "border-destructive/30 bg-destructive/10 text-destructive"
    : "border-primary/30 bg-primary/10 text-primary";
  return (
    <div className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${cls}`}>
      {icon}
      <div><p className="font-semibold">{title}</p><p className="text-sm opacity-90">{description}</p></div>
    </div>
  );
}
