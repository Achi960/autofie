import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_BRANDS, CAR_BRANDS, ALL_REGIONS, REGIONS, CONDITIONS, TRANSMISSIONS, FUELS, BODY_TYPES, REGISTRATION_STATUS } from "@/lib/ghana";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/edit-listing/$id")({
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<any>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (!data) { toast.error("Not found"); navigate({ to: "/my-listings" }); return; }
      if (user && data.user_id !== user.id) { toast.error("Not your listing"); navigate({ to: "/my-listings" }); return; }
      setF(data); setLoading(false);
    })();
  }, [id, user]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const models = f.make ? CAR_BRANDS[f.make] ?? [] : [];
  const districts = f.region ? REGIONS[f.region] ?? [] : [];

  const save = async () => {
    if (!f.title || !f.price || !f.region || !f.district) { toast.error("Title, price, region & district required"); return; }
    setSaving(true);
    const { error } = await supabase.from("listings").update({
      title: f.title, description: f.description ?? null,
      make: f.make ?? null, model: f.model ?? null, year: f.year ?? null,
      condition: f.condition ?? null, transmission: f.transmission ?? null, fuel: f.fuel ?? null,
      mileage: f.mileage ?? null, body_type: f.body_type ?? null, colour: f.colour ?? null,
      engine: f.engine ?? null, registration_status: f.registration_status ?? null,
      region: f.region, district: f.district,
      price: Number(f.price), negotiable: !!f.negotiable, contact: f.contact ?? null,
    }).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Listing updated");
    navigate({ to: "/my-listings" });
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="mx-auto max-w-3xl p-8"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Edit listing</h1>
        <div className="mt-6 space-y-4 rounded-xl border bg-card p-6">
          <Fld label="Title"><Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} maxLength={120} /></Fld>
          <div className="grid gap-4 sm:grid-cols-2">
            <Fld label="Make">
              <Select value={f.make ?? ""} onValueChange={(v) => { set("make", v); set("model", ""); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="max-h-72">{ALL_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </Fld>
            <Fld label="Model">
              <Select value={f.model ?? ""} onValueChange={(v) => set("model", v)} disabled={!f.make}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{models.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Fld>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Fld label="Year"><Input type="number" value={f.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} /></Fld>
            <Fld label="Mileage (km)"><Input type="number" value={f.mileage ?? ""} onChange={(e) => set("mileage", e.target.value ? Number(e.target.value) : null)} /></Fld>
            <Fld label="Colour"><Input value={f.colour ?? ""} onChange={(e) => set("colour", e.target.value)} maxLength={30} /></Fld>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Sel label="Condition" v={f.condition} onChange={(v) => set("condition", v)} opts={CONDITIONS as unknown as string[]} />
            <Sel label="Transmission" v={f.transmission} onChange={(v) => set("transmission", v)} opts={TRANSMISSIONS as unknown as string[]} />
            <Sel label="Fuel" v={f.fuel} onChange={(v) => set("fuel", v)} opts={FUELS as unknown as string[]} />
            <Sel label="Body type" v={f.body_type} onChange={(v) => set("body_type", v)} opts={BODY_TYPES as unknown as string[]} />
            <Sel label="Registration" v={f.registration_status} onChange={(v) => set("registration_status", v)} opts={REGISTRATION_STATUS as unknown as string[]} />
            <Fld label="Engine"><Input value={f.engine ?? ""} onChange={(e) => set("engine", e.target.value)} maxLength={20} /></Fld>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Fld label="Region">
              <Select value={f.region ?? ""} onValueChange={(v) => { set("region", v); set("district", ""); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ALL_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </Fld>
            <Fld label="District">
              <Select value={f.district ?? ""} onValueChange={(v) => set("district", v)} disabled={!f.region}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Fld>
          </div>
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Fld label="Price (GH₵)"><Input type="number" value={f.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Fld>
            <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <Switch checked={!!f.negotiable} onCheckedChange={(v) => set("negotiable", v)} />
              <span className="text-sm">Negotiable</span>
            </label>
          </div>
          <Fld label="Contact phone"><Input value={f.contact ?? ""} onChange={(e) => set("contact", e.target.value)} maxLength={20} /></Fld>
          <Fld label="Description"><Textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={3000} /></Fld>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/my-listings" })}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Sel({ label, v, onChange, opts }: { label: string; v: any; onChange: (v: string) => void; opts: string[] }) {
  return <Fld label={label}>
    <Select value={v ?? ""} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
      <SelectContent>{opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  </Fld>;
}
