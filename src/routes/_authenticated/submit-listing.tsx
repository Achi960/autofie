import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CAR_BRANDS, ALL_BRANDS, REGIONS, ALL_REGIONS, CONDITIONS, TRANSMISSIONS, FUELS, BODY_TYPES, REGISTRATION_STATUS, type CategorySlug } from "@/lib/ghana";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/submit-listing")({
  component: SubmitListing,
});

const CURRENT_YEAR = new Date().getFullYear();

function SubmitListing() {
  const { user, isVerifiedDealer, isPendingDealer } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState<CategorySlug | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [condition, setCondition] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuel, setFuel] = useState("");
  const [mileage, setMileage] = useState<string>("");
  const [bodyType, setBodyType] = useState("");
  const [colour, setColour] = useState("");
  const [engine, setEngine] = useState("");
  const [registration, setRegistration] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [price, setPrice] = useState<string>("");
  const [negotiable, setNegotiable] = useState(false);
  const [contact, setContact] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isVerifiedDealer) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold">Verification required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPendingDealer
              ? "Your dealer application is under review. You'll be able to post once approved."
              : "Only verified dealers can post listings."}
          </p>
          <Button className="mt-4" onClick={() => navigate({ to: "/complete-dealer-profile" })}>
            {isPendingDealer ? "View application" : "Become a dealer"}
          </Button>
        </div>
      </div>
    );
  }

  const models = make && CAR_BRANDS[make] ? CAR_BRANDS[make] : [];
  const districts = region ? REGIONS[region] ?? [] : [];

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = [...photos, ...Array.from(files)].slice(0, 10);
    setPhotos(next);
  };

  const submit = async () => {
    if (!user) return;
    if (!category) { toast.error("Pick a category"); return; }
    if (!title || !price || !region || !district) { toast.error("Fill title, price, region, district"); return; }
    if (photos.length === 0) { toast.error("Add at least one photo"); return; }

    setSubmitting(true);
    try {
      const { data: listing, error: insErr } = await supabase.from("listings").insert({
        user_id: user.id,
        category: category as any,
        title, description: description || null,
        make: make || null, model: model || null,
        year: year ? Number(year) : null,
        condition: condition || null, transmission: transmission || null, fuel: fuel || null,
        mileage: mileage ? Number(mileage) : null,
        body_type: bodyType || null, colour: colour || null, engine: engine || null,
        registration_status: registration || null,
        region, district,
        price: Number(price), negotiable,
        contact: contact || null,
        status: "pending" as const,
      }).select().single();
      if (insErr) throw insErr;

      // upload photos
      const photoRows: { listing_id: string; url: string; is_cover: boolean; sort_order: number }[] = [];
      for (let i = 0; i < photos.length; i++) {
        const f = photos[i];
        const ext = f.name.split(".").pop() || "jpg";
        const path = `${user.id}/${listing.id}/${i}-${Date.now()}.${ext}`;
        await uploadFile("listing-photos", path, f);
        photoRows.push({ listing_id: listing.id, url: path, is_cover: i === 0, sort_order: i });
      }
      await supabase.from("listing_photos").insert(photoRows);
      await supabase.from("listings").update({ cover_photo_url: photoRows[0].url }).eq("id", listing.id);

      toast.success("Listing submitted. An admin will review it shortly.");
      navigate({ to: "/my-listings" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to post listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Post a listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">All listings are reviewed by an admin before going live.</p>

        <div className="mt-6 space-y-6 rounded-xl border bg-card p-6">
          <Field label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as CategorySlug)}>
              <SelectTrigger><SelectValue placeholder="Pick category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2018 Toyota Corolla XLE Foreign Used" maxLength={120} /></Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make">
              <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); }}>
                <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                <SelectContent className="max-h-72">{ALL_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Model">
              <Select value={model} onValueChange={setModel} disabled={!make}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>{models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Year"><Input type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} min={1980} max={CURRENT_YEAR + 1} /></Field>
            <Field label="Mileage (km)"><Input type="number" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} min={0} /></Field>
            <Field label="Colour"><Input value={colour} onChange={(e) => setColour(e.target.value)} maxLength={30} /></Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SimpleSelect label="Condition" value={condition} onChange={setCondition} options={CONDITIONS as unknown as string[]} />
            <SimpleSelect label="Transmission" value={transmission} onChange={setTransmission} options={TRANSMISSIONS as unknown as string[]} />
            <SimpleSelect label="Fuel" value={fuel} onChange={setFuel} options={FUELS as unknown as string[]} />
            <SimpleSelect label="Body type" value={bodyType} onChange={setBodyType} options={BODY_TYPES as unknown as string[]} />
            <SimpleSelect label="Registration" value={registration} onChange={setRegistration} options={REGISTRATION_STATUS as unknown as string[]} />
            <Field label="Engine"><Input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="1.8L" maxLength={20} /></Field>
          </div>

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

          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Price (GH₵)"><Input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} min={0} /></Field>
            <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <Switch checked={negotiable} onCheckedChange={setNegotiable} />
              <span className="text-sm">Price is negotiable</span>
            </label>
          </div>

          <Field label="Contact phone (optional)"><Input inputMode="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Defaults to your account number" maxLength={20} /></Field>

          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={3000} placeholder="Condition details, service history, features…" />
          </Field>

          <div className="space-y-2">
            <Label>Photos ({photos.length}/10) — first photo is the cover</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X className="h-3 w-3" /></button>
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Cover</span>}
                </div>
              ))}
              {photos.length < 10 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs text-muted-foreground hover:border-primary">
                  <Upload className="h-5 w-5" />Add
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for review
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function SimpleSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}
