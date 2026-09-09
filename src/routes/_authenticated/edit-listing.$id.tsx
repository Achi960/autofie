import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColourPicker } from "@/components/ColourPicker";
import { ComboBox } from "@/components/ComboBox";
import { buildAutoTitle } from "@/lib/listing-title";
import { reviewListingDetails } from "@/lib/listing-ai.functions";
import { REGIONS, ALL_REGIONS, CONDITIONS, TRANSMISSIONS, FUELS, BODY_TYPES, REGISTRATION_STATUS, type CategorySlug } from "@/lib/ghana";
import { fieldsFor, brandLibFor, brandsFor } from "@/lib/category-fields";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl, uploadFile } from "@/lib/storage";
import { watermarkImages } from "@/lib/watermark";
import { toast } from "sonner";
import { GripVertical, Loader2, Upload, X, Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/edit-listing/$id")({
  component: EditListing,
});

const CURRENT_YEAR = new Date().getFullYear();

type ExistingPhoto = { id: string; url: string; src: string | null; is_cover: boolean; sort_order: number };

function EditListing() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<any>(null);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newCoverIndex, setNewCoverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [photosBusy, setPhotosBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Listing not found"); navigate({ to: "/my-listings" }); return; }
      if (user && data.user_id !== user.id) { toast.error("Not your listing"); navigate({ to: "/my-listings" }); return; }
      setF(data);
      const { data: ph } = await supabase.from("listing_photos").select("*").eq("listing_id", id).order("sort_order");
      const withSrc = await Promise.all((ph ?? []).map(async (p) => ({
        id: p.id, url: p.url, is_cover: p.is_cover, sort_order: p.sort_order,
        src: await signedUrl("listing-photos", p.url),
      })));
      setExistingPhotos(withSrc);
      setLoading(false);
    })();
  }, [id, user]);

  if (loading || !f) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-muted-foreground">Loading…</div>
    </div>
  );

  const cfg = fieldsFor((f.category as CategorySlug) || "");
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const districts = f.region ? REGIONS[f.region] ?? [] : [];
  const brandLib = brandLibFor((f.category as CategorySlug) || "");
  const brands = brandsFor((f.category as CategorySlug) || "");
  const models = f.make && brandLib[f.make] ? brandLib[f.make] : [];

  const totalPhotos = existingPhotos.length + newPhotos.length;

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - totalPhotos;
    if (remaining <= 0) { toast.error("Max 10 photos"); return; }
    setNewPhotos([...newPhotos, ...Array.from(files).slice(0, remaining)]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((current) => current.filter((_, i) => i !== index));
    setNewCoverIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      return index < current ? current - 1 : current;
    });
  };

  const moveNewPhoto = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= newPhotos.length || to >= newPhotos.length) return;
    setNewPhotos((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setNewCoverIndex((current) => {
      if (current === null) return null;
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
  };

  const setCover = async (photoId: string) => {
    setPhotosBusy(true);
    try {
      const target = existingPhotos.find(p => p.id === photoId);
      if (!target) return;
      await supabase.from("listing_photos").update({ is_cover: false }).eq("listing_id", id);
      await supabase.from("listing_photos").update({ is_cover: true }).eq("id", photoId);
      await supabase.from("listings").update({ cover_photo_url: target.url }).eq("id", id);
      setExistingPhotos(existingPhotos.map(p => ({ ...p, is_cover: p.id === photoId })));
      setNewCoverIndex(null);
      toast.success("Cover updated");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setPhotosBusy(false); }
  };

  const deletePhoto = async (photoId: string) => {
    if (existingPhotos.length <= 1 && newPhotos.length === 0) { toast.error("Listings need at least one photo"); return; }
    setPhotosBusy(true);
    try {
      const target = existingPhotos.find(p => p.id === photoId);
      if (!target) return;
      await supabase.from("listing_photos").delete().eq("id", photoId);
      try { await supabase.storage.from("listing-photos").remove([target.url]); } catch {}
      const remaining = existingPhotos.filter(p => p.id !== photoId);
      // If we removed the cover, pick the first remaining as new cover
      if (target.is_cover && remaining.length) {
        await supabase.from("listing_photos").update({ is_cover: true }).eq("id", remaining[0].id);
        await supabase.from("listings").update({ cover_photo_url: remaining[0].url }).eq("id", id);
        remaining[0] = { ...remaining[0], is_cover: true };
      }
      setExistingPhotos(remaining);
      toast.success("Photo removed");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setPhotosBusy(false); }
  };

  const save = async (resubmit: boolean) => {
    if (!f.price || !f.region || !f.district) { toast.error("Fill price, region and district"); return; }
    if (totalPhotos === 0) { toast.error("Add at least one photo"); return; }
    setSaving(true);
    try {
      // Spell-check the make/model the dealer typed before saving
      if (f.make || f.model) {
        try {
          const review = await reviewListingDetails({
            data: {
              category: (f.category as any) ?? "car",
              make: f.make ?? "", model: f.model ?? "",
              title: f.title ?? "", description: f.description ?? "",
              year: f.year ? String(f.year) : "", colour: f.colour ?? "",
              knownMakes: brands.slice(0, 300),
              knownModels: (models.length ? models : Object.values(brandLib).flat()).slice(0, 300),
            },
          });
          const notes = [...review.notes];
          if (review.make !== (f.make ?? "") || review.model !== (f.model ?? "")) {
            f.make = review.make;
            f.model = review.model;
          }
          if (notes.length) toast.info(notes.slice(0, 3).join(" · "));
        } catch { /* best-effort */ }
      }
      if (!f.title) {
        f.title = buildAutoTitle({ make: f.make, model: f.model, year: f.year, colour: f.colour });
        if (!f.title) { toast.error("Add a title"); setSaving(false); return; }
      }
      // Upload any new photos first
      if (newPhotos.length && user) {
        // Resolve shop name for the watermark
        const { data: dp } = await supabase.from("dealer_profiles").select("business_name").eq("user_id", user.id).maybeSingle();
        const { data: pr } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        const shopName = dp?.business_name || pr?.full_name || "";
        const stamped = await watermarkImages(newPhotos, shopName);

        const startOrder = existingPhotos.length;
        const rows = [] as { listing_id: string; url: string; is_cover: boolean; sort_order: number }[];
        for (let i = 0; i < stamped.length; i++) {
          const file = stamped[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${user.id}/${id}/${startOrder + i}-${Date.now()}.${ext}`;
          await uploadFile("listing-photos", path, file);
          rows.push({ listing_id: id, url: path, is_cover: newCoverIndex === i || (existingPhotos.length === 0 && newCoverIndex === null && i === 0), sort_order: startOrder + i });
        }
        if (newCoverIndex !== null || existingPhotos.length === 0) {
          await supabase.from("listing_photos").update({ is_cover: false }).eq("listing_id", id);
        }
        await supabase.from("listing_photos").insert(rows);
        const coverRow = newCoverIndex !== null ? rows[newCoverIndex] : (existingPhotos.length === 0 ? rows[0] : null);
        if (coverRow) {
          await supabase.from("listings").update({ cover_photo_url: coverRow.url }).eq("id", id);
        }
      }

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
          {/* PHOTO MANAGER */}
          <div className="space-y-2">
            <Label>Photos ({totalPhotos}/10) — tap a photo to set it as cover</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {existingPhotos.map((p) => (
                <div key={p.id} className={`group relative aspect-square overflow-hidden rounded-md border ${p.is_cover && newCoverIndex === null ? "ring-2 ring-primary" : ""}`}>
                  <button type="button" disabled={photosBusy} onClick={() => setCover(p.id)} className="h-full w-full" aria-label="Set as cover photo">
                    {p.src ? <img src={p.src} alt="Listing preview" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-muted" />}
                  </button>
                  {p.is_cover && newCoverIndex === null && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"><Star className="mr-0.5 inline h-3 w-3" />Cover</span>
                  )}
                  <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!p.is_cover && (
                      <button type="button" disabled={photosBusy} onClick={() => setCover(p.id)}
                        className="rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] text-background"><Star className="inline h-3 w-3" /> Cover</button>
                    )}
                    <button type="button" disabled={photosBusy} onClick={() => deletePhoto(p.id)}
                      className="ml-auto rounded bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground"><Trash2 className="inline h-3 w-3" /></button>
                  </div>
                </div>
              ))}
              {newPhotos.map((file, i) => (
                <div
                  key={`new-${file.name}-${i}`}
                  className={`relative aspect-square overflow-hidden rounded-md border border-dashed ${newCoverIndex === i ? "ring-2 ring-primary" : ""}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) moveNewPhoto(dragIndex, i); setDragIndex(null); }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <button type="button" onClick={() => setNewCoverIndex(i)} className="h-full w-full" aria-label="Set new photo as cover">
                    <img src={URL.createObjectURL(file)} alt="Listing preview" className="h-full w-full object-cover" />
                  </button>
                  <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1 py-0.5 text-muted-foreground shadow-sm">
                    <GripVertical className="h-3 w-3" />
                  </span>
                  <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${newCoverIndex === i ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                    {newCoverIndex === i ? <><Star className="mr-0.5 inline h-3 w-3" />Cover</> : "New"}
                  </span>
                  <button type="button" onClick={() => removeNewPhoto(i)}
                    className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {totalPhotos < 10 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs text-muted-foreground hover:border-primary">
                  <Upload className="h-5 w-5" />Add
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickPhotos(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          <Field label="Title">
            <Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} maxLength={120} />
            <button
              type="button"
              onClick={() => {
                const auto = buildAutoTitle({ make: f.make, model: f.model, year: f.year, colour: f.colour });
                if (auto) set("title", auto); else toast.error("Add make, model, year or colour first");
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Rebuild title from make, model, year and colour
            </button>
          </Field>

          {cfg.make !== "off" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={cfg.makeLabel}>
                {cfg.make === "list" ? (
                  <ComboBox
                    value={f.make ?? ""}
                    onChange={(v) => setF({ ...f, make: v, model: "" })}
                    options={brands}
                    noun={cfg.makeLabel.toLowerCase()}
                    placeholder={`Select ${cfg.makeLabel.toLowerCase()}`}
                  />
                ) : (
                  <Input value={f.make ?? ""} onChange={(e) => set("make", e.target.value)} maxLength={40} />
                )}
              </Field>
              <Field label={cfg.modelLabel}>
                {cfg.make === "list" ? (
                  <ComboBox
                    value={f.model ?? ""}
                    onChange={(v) => set("model", v)}
                    options={models}
                    disabled={!f.make}
                    noun={cfg.modelLabel.toLowerCase()}
                    placeholder={`Select ${cfg.modelLabel.toLowerCase()}`}
                  />
                ) : (
                  <Input value={f.model ?? ""} onChange={(e) => set("model", e.target.value)} maxLength={40} />
                )}
              </Field>
              <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">
                Can't find yours? Type it in — we'll check the spelling when you save.
              </p>
            </div>
          )}

          {(cfg.year || cfg.mileage) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {cfg.year && <Field label="Year"><Input type="number" value={f.year ?? ""} onChange={(e) => set("year", e.target.value)} min={1980} max={CURRENT_YEAR + 1} /></Field>}
              {cfg.mileage && (
                <Field label="Mileage (km)">
                  <Input inputMode="numeric"
                    value={f.mileage ? Number(f.mileage).toLocaleString("en-GH") : ""}
                    onChange={(e) => set("mileage", e.target.value.replace(/[^\d]/g, ""))} />
                </Field>
              )}
            </div>
          )}

          {cfg.colour && (
            <Field label="Colour"><ColourPicker value={f.colour ?? ""} onChange={(v) => set("colour", v)} /></Field>
          )}

          {(cfg.condition || cfg.transmission || cfg.fuel || cfg.bodyType || cfg.registration || cfg.engine) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {cfg.condition && <SS label="Condition" value={f.condition ?? ""} onChange={(v) => set("condition", v)} options={CONDITIONS as unknown as string[]} />}
              {cfg.transmission && <SS label="Transmission" value={f.transmission ?? ""} onChange={(v) => set("transmission", v)} options={TRANSMISSIONS as unknown as string[]} />}
              {cfg.fuel && <SS label="Fuel" value={f.fuel ?? ""} onChange={(v) => set("fuel", v)} options={FUELS as unknown as string[]} />}
              {cfg.bodyType && <SS label="Body type" value={f.body_type ?? ""} onChange={(v) => set("body_type", v)} options={BODY_TYPES as unknown as string[]} />}
              {cfg.registration && (
                <SS label="Registration" value={f.registration_status ?? ""}
                  onChange={(v) => setF({ ...f, registration_status: v, registration_year: v === "Registered" ? f.registration_year : null })}
                  options={REGISTRATION_STATUS as unknown as string[]} />
              )}
              {cfg.registration && f.registration_status === "Registered" && (
                <Field label="Year of registration">
                  <Input type="number" value={f.registration_year ?? ""} onChange={(e) => set("registration_year", e.target.value)} min={1980} max={CURRENT_YEAR + 1} />
                </Field>
              )}
              {cfg.engine && (
                <Field label={cfg.engineLabel}>
                  <Input value={f.engine ?? ""} onChange={(e) => set("engine", e.target.value)} maxLength={20} placeholder={cfg.engineLabel === "Operating hours" ? "e.g. 4,500" : "e.g. 1.8L"} />
                </Field>
              )}
            </div>
          )}

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
                <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid items-end gap-4 sm:grid-cols-2">
            <Field label="Price (GH₵)">
              <div className="flex items-center gap-2 rounded-md border bg-background px-3">
                <span className="text-sm font-medium text-muted-foreground">GH₵</span>
                <Input inputMode="numeric"
                  value={f.price ? Number(f.price).toLocaleString("en-GH") : ""}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))}
                  className="border-0 px-0 shadow-none focus-visible:ring-0" />
              </div>
            </Field>
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
