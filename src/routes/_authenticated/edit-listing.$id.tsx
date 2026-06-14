import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAR_BRANDS, ALL_BRANDS, REGIONS, ALL_REGIONS, CONDITIONS, TRANSMISSIONS, FUELS, BODY_TYPES, REGISTRATION_STATUS } from "@/lib/ghana";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/edit-listing/$id")({
  component: EditListing,
});

const CURRENT_YEAR = new Date().getFullYear();

function EditListing() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Listing not found"); navigate({ to: "/my-listings" }); return; }
      if (user && data.user_id !== user.id) { toast.error("Not your listing"); navigate({ to: "/my-listings" }); return; }
      setF(data);
      setLoading(false);
    })();
  }, [id, user]);

  if (loading || !f) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-muted-foreground">Loading…</div>
    </div>
  );

  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const districts = f.region ? REGIONS[f.region] ?? [] : [];
  const models = f.make && CAR_BRANDS[f.make] ? CAR_BRANDS[f.make] : [];

  const save = async (resubmit: boolean) => {
    if (!f.title || !f.price || !f.region || !f.district) { toast.error("Fill title, price, region, district"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("listings").update({
        title: f.title, description: f.description || null,
        make: f.make || null, model: f.model || null,
        year: f.year ? Number(f.year) : null,
        condition: f.condition || null, transmission: f.transmission || null, fuel: f.fuel || null,
        mileage: f.mileage ? Number(f.mileage) : null,
        body_type: f.body_type || null, colour: f.colour || null, engine: f.engine || null,
        registration_status: f.registration_status || null,
        registration_year: f.registration_status === "Registered" && f.registration_year ? Number(f.registration_year) : null,
        region: f.region, district: f.district,
        price: Number(f.price), negotiable: !!f.negotiable,
        contact: f.contact || null,
        contact_name: f.contact_name || null,
        ...(resubmit ? { status: "pending", rejection_reason: null } : {}),
      }).eq("id", id);
      if (error) throw error;
      toast.success(resubmit ? "Saved and re-submitted for review" : "Saved");
      navigate({ to: "/my-listings" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Edit listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Re-submit to send the changes back to an admin for review.</p>

        <div className="mt-6 space-y-6 rounded-xl border bg-card p-6">
          <Field label="Title"><Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} maxLength={120} /></Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make">
              <Select value={f.make ?? ""} onValueChange={(v) => setF({ ...f, make: v, model: "" })}>
                <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                <SelectContent className="max-h-72">{ALL_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Model">
              <Select value={f.model ?? ""} onValueChange={(v) => set("model", v)} disabled={!f.make}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>{models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Year"><Input type="number" value={f.year ?? ""} onChange={(e) => set("year", e.target.value)} min={1980} max={CURRENT_YEAR + 1} /></Field>
            <Field label="Mileage (km)"><Input type="number" value={f.mileage ?? ""} onChange={(e) => set("mileage", e.target.value)} min={0} /></Field>
            <Field label="Colour"><Input value={f.colour ?? ""} onChange={(e) => set("colour", e.target.value)} maxLength={30} /></Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SS label="Condition" value={f.condition ?? ""} onChange={(v) => set("condition", v)} options={CONDITIONS as unknown as string[]} />
            <SS label="Transmission" value={f.transmission ?? ""} onChange={(v) => set("transmission", v)} options={TRANSMISSIONS as unknown as string[]} />
            <SS label="Fuel" value={f.fuel ?? ""} onChange={(v) => set("fuel", v)} options={FUELS as unknown as string[]} />
            <SS label="Body type" value={f.body_type ?? ""} onChange={(v) => set("body_type", v)} options={BODY_TYPES as unknown as string[]} />
            <SS label="Registration" value={f.registration_status ?? ""} onChange={(v) => setF({ ...f, registration_status: v, registration_year: v === "Registered" ? f.registration_year : null })} options={REGISTRATION_STATUS as unknown as string[]} />
            {f.registration_status === "Registered" && (
              <Field label="Year of registration">
                <Input type="number" value={f.registration_year ?? ""} onChange={(e) => set("registration_year", e.target.value)} min={1980} max={CURRENT_YEAR + 1} />
              </Field>
            )}
            <Field label="Engine"><Input value={f.engine ?? ""} onChange={(e) => set("engine", e.target.value)} maxLength={20} /></Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Region">
              <Select value={f.region ?? ""} onValueChange={(v) => setF({ ...f, region: v, district: "" })}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>{ALL_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="District">
              <Select value={f.district ?? ""} onValueChange={(v) => set("district", v)} disabled={!f.region}>
                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Price (GH₵)"><Input type="number" value={f.price ?? ""} onChange={(e) => set("price", e.target.value)} min={0} /></Field>
            <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <Switch checked={!!f.negotiable} onCheckedChange={(v) => set("negotiable", v)} />
              <span className="text-sm">Price is negotiable</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name"><Input value={f.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} maxLength={60} /></Field>
            <Field label="Contact phone"><Input inputMode="tel" value={f.contact ?? ""} onChange={(e) => set("contact", e.target.value)} maxLength={20} /></Field>
          </div>

          <Field label="Description">
            <Textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={3000} />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => save(true)} disabled={saving} size="lg" className="flex-1">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save & re-submit for review
            </Button>
            <Button onClick={() => save(false)} disabled={saving} variant="outline" size="lg">Save without re-submitting</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function SS({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}
