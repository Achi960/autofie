import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Loader2, Upload, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/submit-listing")({
  component: SubmitListing,
});

const CURRENT_YEAR = new Date().getFullYear();
const MIN_PHOTOS = 5;
const MAX_PHOTOS = 10;

function SubmitListing() {
  const { user, isVerifiedDealer, isPendingDealer } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<CategorySlug | "">("");
  const [photos, setPhotos] = useState<File[]>([]);
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
    const next = [...photos, ...Array.from(files)].slice(0, MAX_PHOTOS);
    setPhotos(next);
  };

  const next = () => {
    if (step === 1) {
      if (!category) { toast.error("Pick a category to continue"); return; }
      setStep(2);
    } else if (step === 2) {
      if (photos.length < MIN_PHOTOS) { toast.error(`Add at least ${MIN_PHOTOS} photos`); return; }
      setStep(3);
    }
  };

  const submit = async () => {
    if (!user) return;
    if (!title || !price || !region || !district || !make || !model || !year || !colour || !condition) {
      toast.error("Fill title, make, model, year, colour, condition, region, district & price"); return;
    }
    setSubmitting(true);
    try {
      const { data: listing, error: insErr } = await supabase.from("listings").insert({
        user_id: user.id,
        category: category as any,
        title, description: description || null,
        make, model, year: Number(year),
        condition, transmission: transmission || null, fuel: fuel || null,
        mileage: mileage ? Number(mileage) : null,
        body_type: bodyType || null, colour, engine: engine || null,
        registration_status: registration || null,
        region, district,
        price: Number(price), negotiable,
        contact: contact || null,
        status: "pending" as const,
      }).select().single();
      if (insErr) throw insErr;

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
        <p className="mt-1 text-sm text-muted-foreground">Step {step} of 3. Reviewed by an admin before going live.</p>

        {/* Stepper */}
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {step > n ? <Check className="h-4 w-4" /> : n}
              </div>
              <span className={cn("text-xs", step >= n ? "font-medium text-foreground" : "text-muted-foreground")}>
                {n === 1 ? "Category" : n === 2 ? "Photos" : "Details"}
              </span>
              {n < 3 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="mt-6 rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">What are you selling?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button key={c.slug} type="button" onClick={() => setCategory(c.slug)}
                  className={cn("rounded-xl border-2 p-4 text-center text-sm font-medium transition",
                    category === c.slug ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:border-primary/50")}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={next}>Next →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Upload at least {MIN_PHOTOS} photos</h2>
            <p className="mt-1 text-xs text-muted-foreground">First photo is the cover. {photos.length}/{MAX_PHOTOS} selected.</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X className="h-3 w-3" /></button>
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Cover</span>}
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs text-muted-foreground hover:border-primary">
                  <Upload className="h-5 w-5" />Add
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
                </label>
              )}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={next} disabled={photos.length < MIN_PHOTOS}>Next →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4 rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Vehicle details</h2>
            <Fld label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2018 Toyota Corolla XLE Foreign Used" maxLength={120} /></Fld>
            <div className="grid gap-4 sm:grid-cols-2">
              <Fld label="Make">
                <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select make" /></SelectTrigger>
                  <SelectContent className="max-h-72">{ALL_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </Fld>
              <Fld label="Model">
                <Select value={model} onValueChange={setModel} disabled={!make}>
                  <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>{models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </Fld>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Fld label="Year"><Input type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} min={1980} max={CURRENT_YEAR + 1} /></Fld>
              <Fld label="Mileage (km)"><Input type="number" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} min={0} /></Fld>
              <Fld label="Colour"><Input value={colour} onChange={(e) => setColour(e.target.value)} maxLength={30} /></Fld>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Sel label="Condition" value={condition} onChange={setCondition} options={CONDITIONS as unknown as string[]} />
              <Sel label="Transmission" value={transmission} onChange={setTransmission} options={TRANSMISSIONS as unknown as string[]} />
              <Sel label="Fuel" value={fuel} onChange={setFuel} options={FUELS as unknown as string[]} />
              <Sel label="Body type" value={bodyType} onChange={setBodyType} options={BODY_TYPES as unknown as string[]} />
              <Sel label="Registration" value={registration} onChange={setRegistration} options={REGISTRATION_STATUS as unknown as string[]} />
              <Fld label="Engine"><Input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="1.8L" maxLength={20} /></Fld>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Fld label="Region">
                <Select value={region} onValueChange={(v) => { setRegion(v); setDistrict(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>{ALL_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Fld>
              <Fld label="District">
                <Select value={district} onValueChange={setDistrict} disabled={!region}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Fld>
            </div>
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <Fld label="Price (GH₵)"><Input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} min={0} /></Fld>
              <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                <Switch checked={negotiable} onCheckedChange={setNegotiable} />
                <span className="text-sm">Price is negotiable</span>
              </label>
            </div>
            <Fld label="Contact phone (optional)"><Input inputMode="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Defaults to your account number" maxLength={20} /></Fld>
            <Fld label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={3000} placeholder="Condition details, service history, features…" /></Fld>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for review
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Fld label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </Fld>
  );
}
