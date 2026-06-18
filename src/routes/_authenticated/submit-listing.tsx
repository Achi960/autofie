import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryPicker } from "@/components/CategoryPicker";
import { ColourPicker } from "@/components/ColourPicker";
import { REGIONS, ALL_REGIONS, CONDITIONS, TRANSMISSIONS, FUELS, BODY_TYPES, REGISTRATION_STATUS, type CategorySlug } from "@/lib/ghana";
import { fieldsFor, brandLibFor, brandsFor } from "@/lib/category-fields";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { watermarkImages } from "@/lib/watermark";
import { toast } from "sonner";
import { notifyAdminWhatsapp } from "@/lib/admin-notify.functions";
import { GripVertical, Loader2, Star, Upload, X } from "lucide-react";

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
  const [registrationYear, setRegistrationYear] = useState<string>("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [price, setPrice] = useState<string>("");
  const [negotiable, setNegotiable] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cfg = useMemo(() => fieldsFor(category), [category]);

  // Auto-populate name + phone from the signed-in user's profile
  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return;
        if (!contactName && data.full_name) setContactName(data.full_name);
        if (!contactPhone && data.phone) setContactPhone(data.phone);
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const brandLib = brandLibFor(category);
  const brands = brandsFor(category);
  const models = make && brandLib[make] ? brandLib[make] : [];
  const districts = region ? REGIONS[region] ?? [] : [];

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = [...photos, ...Array.from(files)].slice(0, 10);
    setPhotos(next);
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
    setCoverIndex((current) => {
      if (photos.length <= 1) return 0;
      if (index === current) return 0;
      if (index < current) return current - 1;
      return Math.min(current, photos.length - 2);
    });
  };

  const movePhoto = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return;
    setPhotos((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setCoverIndex((current) => {
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
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
        make: cfg.make !== "off" && make ? make : null,
        model: cfg.make !== "off" && model ? model : null,
        year: cfg.year && year ? Number(year) : null,
        condition: cfg.condition && condition ? condition : null,
        transmission: cfg.transmission && transmission ? transmission : null,
        fuel: cfg.fuel && fuel ? fuel : null,
        mileage: cfg.mileage && mileage ? Number(mileage) : null,
        body_type: cfg.bodyType && bodyType ? bodyType : null,
        colour: cfg.colour && colour ? colour : null,
        engine: cfg.engine && engine ? engine : null,
        registration_status: cfg.registration && registration ? registration : null,
        registration_year: cfg.registration && registration === "Registered" && registrationYear ? Number(registrationYear) : null,
        region, district,
        price: Number(price), negotiable,
        contact: contactPhone || null,
        contact_name: contactName || null,
        status: "pending" as const,
      }).select().single();
      if (insErr) throw insErr;

      const photoRows: { listing_id: string; url: string; is_cover: boolean; sort_order: number }[] = [];
      for (let i = 0; i < photos.length; i++) {
        const f = photos[i];
        const ext = f.name.split(".").pop() || "jpg";
        const path = `${user.id}/${listing.id}/${i}-${Date.now()}.${ext}`;
        await uploadFile("listing-photos", path, f);
        photoRows.push({ listing_id: listing.id, url: path, is_cover: i === coverIndex, sort_order: i });
      }
      await supabase.from("listing_photos").insert(photoRows);
      await supabase.from("listings").update({ cover_photo_url: photoRows[coverIndex]?.url ?? photoRows[0].url }).eq("id", listing.id);

      // Fire-and-forget admin WhatsApp alert (no-op if Twilio not configured)
      notifyAdminWhatsapp({
        data: { message: `📋 New listing pending review on AutoFie\n\n"${title}"\nby ${contactName || user.email}\nGH₵${Number(price).toLocaleString("en-GH")}\n\nReview: ${window.location.origin}/admin/listings` },
      }).catch(() => {});

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
            <CategoryPicker value={category} onChange={(v) => setCategory(v)} />
          </Field>

          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={cfg.titlePlaceholder} maxLength={120} />
          </Field>

          {/* Make / model */}
          {cfg.make === "list" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={cfg.makeLabel}>
                <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); }}>
                  <SelectTrigger><SelectValue placeholder={`Select ${cfg.makeLabel.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent className="max-h-72">{brands.map(b => <SelectItem key={b} value={b}>{b.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={cfg.modelLabel}>
                <Select value={model} onValueChange={setModel} disabled={!make}>
                  <SelectTrigger><SelectValue placeholder={`Select ${cfg.modelLabel.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent>{models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          )}
          {cfg.make === "text" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={cfg.makeLabel}>
                <Input value={make} onChange={(e) => setMake(e.target.value)} maxLength={40} placeholder={cfg.makeLabel} />
              </Field>
              <Field label={cfg.modelLabel}>
                <Input value={model} onChange={(e) => setModel(e.target.value)} maxLength={40} placeholder={cfg.modelLabel} />
              </Field>
            </div>
          )}

          {(cfg.year || cfg.mileage) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {cfg.year && (
                <Field label="Year"><Input type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} min={1980} max={CURRENT_YEAR + 1} /></Field>
              )}
              {cfg.mileage && (
                <Field label="Mileage (km)">
                  <Input
                    inputMode="numeric"
                    value={mileage ? Number(mileage).toLocaleString("en-GH") : ""}
                    onChange={(e) => setMileage(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </Field>
              )}
            </div>
          )}

          {cfg.colour && (
            <Field label="Colour">
              <ColourPicker value={colour} onChange={setColour} />
            </Field>
          )}

          {(cfg.condition || cfg.transmission || cfg.fuel || cfg.bodyType || cfg.registration || cfg.engine) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {cfg.condition && <SimpleSelect label="Condition" value={condition} onChange={setCondition} options={CONDITIONS as unknown as string[]} />}
              {cfg.transmission && <SimpleSelect label="Transmission" value={transmission} onChange={setTransmission} options={TRANSMISSIONS as unknown as string[]} />}
              {cfg.fuel && <SimpleSelect label="Fuel" value={fuel} onChange={setFuel} options={FUELS as unknown as string[]} />}
              {cfg.bodyType && <SimpleSelect label="Body type" value={bodyType} onChange={setBodyType} options={BODY_TYPES as unknown as string[]} />}
              {cfg.registration && (
                <SimpleSelect label="Registration" value={registration} onChange={(v) => { setRegistration(v); if (v !== "Registered") setRegistrationYear(""); }} options={REGISTRATION_STATUS as unknown as string[]} />
              )}
              {cfg.registration && registration === "Registered" && (
                <Field label="Year of registration">
                  <Input type="number" inputMode="numeric" value={registrationYear} onChange={(e) => setRegistrationYear(e.target.value)} min={1980} max={CURRENT_YEAR + 1} placeholder={String(CURRENT_YEAR)} />
                </Field>
              )}
              {cfg.engine && (
                <Field label={cfg.engineLabel}>
                  <Input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder={cfg.engineLabel === "Operating hours" ? "e.g. 4,500" : "e.g. 1.8L"} maxLength={20} />
                </Field>
              )}
            </div>
          )}

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
            <Field label="Price (GH₵)">
              <div className="flex items-center gap-2 rounded-md border bg-background px-3">
                <span className="text-sm font-medium text-muted-foreground">GH₵</span>
                <Input
                  inputMode="numeric"
                  value={price ? Number(price).toLocaleString("en-GH") : ""}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="50,000"
                  className="border-0 px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </Field>
            <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <Switch checked={negotiable} onCheckedChange={setNegotiable} />
              <span className="text-sm">Price is negotiable</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name (visible to buyers)"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Kwame Mensah" maxLength={60} /></Field>
            <Field label="Contact phone (visible to buyers)"><Input inputMode="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g. 024 123 4567" maxLength={20} /></Field>
          </div>

          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={3000} placeholder={category === "services" ? "Describe the service, coverage area, pricing…" : "Condition details, service history, features…"} />
          </Field>

          <div className="space-y-2">
            <Label>Photos ({photos.length}/10) — tap a photo to set it as cover</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className={`group relative aspect-square overflow-hidden rounded-md border ${i === coverIndex ? "ring-2 ring-primary" : ""}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) movePhoto(dragIndex, i); setDragIndex(null); }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <button type="button" onClick={() => setCoverIndex(i)} className="h-full w-full" aria-label="Set as cover photo">
                    <img src={URL.createObjectURL(f)} alt="Listing preview" className="h-full w-full object-cover" />
                  </button>
                  <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1 py-0.5 text-muted-foreground shadow-sm">
                    <GripVertical className="h-3 w-3" />
                  </span>
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background"><X className="h-3 w-3" /></button>
                  {i === coverIndex && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"><Star className="mr-0.5 inline h-3 w-3" />Cover</span>}
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
