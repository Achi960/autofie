import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Stethoscope, Upload, AlertTriangle, Wrench, CheckCircle2, X, Loader2, ShieldAlert, ScanLine, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { diagnoseVehicle, type DiagnoseResult } from "@/lib/diagnose.functions";

const FAQS = [
  {
    q: "What does my dashboard warning light mean?",
    a: "Dashboard warning lights are colour-coded: red usually means stop driving immediately (brakes, engine temperature, oil pressure), amber means service soon (check engine, ABS, tyre pressure), and green or blue is informational (headlights, indicators). Upload a photo of the light using the diagnose tool above and AutoFie's AI will identify the specific symbol and explain what to do next.",
  },
  {
    q: "Why is my car shaking when I drive?",
    a: "Shaking at low speeds often points to engine misfires, worn spark plugs, or a loose motor mount. Shaking at highway speeds is usually unbalanced tyres, bent rims, or worn suspension components. Shaking only when braking points to warped brake rotors. Any vibration that changes with speed should be checked by a mechanic — never ignore it.",
  },
  {
    q: "Is it safe to drive with the check engine light on?",
    a: "If the check engine light is steady (not flashing) and the car drives normally, you can usually drive to a mechanic within a few days. A flashing check engine light means a serious misfire that can destroy the catalytic converter — pull over safely and arrange a tow.",
  },
  {
    q: "Why does my car smell like burning?",
    a: "A burning smell can come from many sources: burning rubber (slipping belt or hose touching the exhaust), burning oil (leaking onto hot engine parts), burning plastic (electrical short), or sweet syrup smell (coolant leak). Pull over, switch off the engine, and let it cool before opening the bonnet. Most burning smells need a mechanic.",
  },
  {
    q: "Why won't my car start?",
    a: "If you hear nothing when you turn the key, the battery is usually flat — try jump-starting it. If you hear rapid clicking, the battery is too weak to crank the engine. If the engine cranks but won't fire, it's typically fuel, spark, or the starter. Lights and electronics working but no crank often means a faulty starter motor or ignition switch.",
  },
  {
    q: "How often should I service my vehicle in Ghana?",
    a: "For most cars in Ghana, change engine oil every 5,000 km because of dust, heat, and traffic. Replace air filters every 10,000 km, check brakes every 15,000 km, and do a full inspection every 6 months. Motorcycles need oil changes every 2,000–3,000 km. Tractors and trucks follow hour-based intervals from the manufacturer.",
  },
];

export const Route = createFileRoute("/diagnose")({
  head: () => ({
    meta: [
      { title: "Free AI Car Diagnosis Tool — Identify Any Car Problem | AutoFie" },
      { name: "description", content: "Describe your car problem or upload a photo and get an instant diagnosis. Works for all cars, motorcycles, trucks, and tractors. Free to use." },
      { property: "og:title", content: "Free AI Car Diagnosis Tool — Identify Any Car Problem | AutoFie" },
      { property: "og:description", content: "Describe your car problem or upload a photo and get an instant diagnosis. Works for all cars, motorcycles, trucks, and tractors. Free to use." },
      { property: "og:url", content: "https://autofie.com/diagnose" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://autofie.com/diagnose" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    }],
  }),
  component: DiagnosePage,
});

const VEHICLE_TYPES = [
  { v: "unspecified", label: "Any" },
  { v: "car", label: "Car" },
  { v: "motorcycle", label: "Motorcycle" },
  { v: "bus", label: "Bus" },
  { v: "truck", label: "Truck" },
  { v: "tractor", label: "Tractor" },
] as const;

const ENGINE_TYPES = [
  { v: "unspecified", label: "Any" },
  { v: "manual", label: "Manual" },
  { v: "automatic", label: "Automatic" },
  { v: "electric", label: "Electric" },
] as const;

function DiagnosePage() {
  const diagnose = useServerFn(diagnoseVehicle);
  const [description, setDescription] = useState("");
  const [vehicleType, setVehicleType] = useState<typeof VEHICLE_TYPES[number]["v"]>("unspecified");
  const [engineType, setEngineType] = useState<typeof ENGINE_TYPES[number]["v"]>("unspecified");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      toast.error("Please describe the problem in a bit more detail.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await diagnose({ data: { description, vehicleType, engineType, imageDataUrl } });
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Diagnosis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary via-secondary to-secondary/90 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
            <Stethoscope className="h-3.5 w-3.5" /> Free AI diagnosis
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            AI Car Diagnose
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:text-base">
            Describe a noise, warning light, smell or performance issue — or upload a photo — and get an
            instant AI-powered diagnosis with safe DIY steps and clear mechanic recommendations.
          </p>

          <Link
            to="/vin"
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110"
          >
            <ScanLine className="h-4 w-4" /> Free VIN Decoder &amp; History Check
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Tool */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
          <label htmlFor="problem" className="block text-sm font-semibold text-foreground">
            What's wrong with your vehicle?
          </label>
          <Textarea
            id="problem"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g. There's a yellow engine-shaped light on my dashboard and the car jerks when I press the accelerator from a stop…"
            className="mt-2 min-h-[120px]"
            maxLength={2000}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vtype" className="block text-xs font-semibold text-foreground">Vehicle type</label>
              <select
                id="vtype"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as typeof vehicleType)}
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {VEHICLE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="etype" className="block text-xs font-semibold text-foreground">Engine / transmission</label>
              <select
                id="etype"
                value={engineType}
                onChange={(e) => setEngineType(e.target.value as typeof engineType)}
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {ENGINE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Image upload */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-foreground">Optional photo (dashboard light, damage, leak)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); }}
            />
            {imageDataUrl ? (
              <div className="relative mt-2 inline-block">
                <img src={imageDataUrl} alt="Uploaded vehicle issue" className="h-32 w-32 rounded-lg border object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => { setImageDataUrl(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute -right-2 -top-2 rounded-full bg-secondary p-1 text-white shadow"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-dashed border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
              >
                <Upload className="h-4 w-4" /> Upload photo
              </button>
            )}
          </div>

          <Button type="submit" disabled={loading} className="mt-6 w-full sm:w-auto">
            {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Diagnosing…</>) : "Diagnose now"}
          </Button>
        </form>

        {result && <DiagnosisResultCard result={result} />}

        <p className="mt-4 text-xs text-muted-foreground">
          <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
          This tool gives general guidance only and is not a substitute for a qualified mechanic.
          For safety-critical issues, always consult a professional.
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">Common car problems answered</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Quick answers to questions Ghanaian drivers ask most.</p>
          <div className="mt-8 space-y-4">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl border bg-card p-5 shadow-sm">
                <summary className="cursor-pointer list-none text-base font-semibold text-foreground marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-primary transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DiagnosisResultCard({ result }: { result: DiagnoseResult }) {
  const severityStyle = {
    low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    high: "bg-primary/10 text-primary border-primary/40",
  }[result.severity];

  return (
    <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Diagnosis</h2>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyle}`}>
          <AlertTriangle className="h-3.5 w-3.5" />
          {result.severity === "high" ? "Do not drive" : result.severity === "medium" ? "Drive with caution" : "Minor issue"}
        </span>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-foreground">Likely cause</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.likelyCause}</p>
      </div>

      {result.diySteps.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Safe DIY steps
          </h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {result.diySteps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}

      {result.obdCodes.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Diagnostic trouble codes</h3>
          {result.obdCodes.map((c, i) => (
            <div key={i} className="rounded-lg border border-border bg-background/60 p-4">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary">{c.code}</span>
                <span className="font-normal text-muted-foreground">{c.system}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{c.meaning}</p>
              {c.commonCauses.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-foreground">Common causes</p>
                  <ul className="ml-5 list-disc text-sm text-muted-foreground">
                    {c.commonCauses.map((x, j) => <li key={j}>{x}</li>)}
                  </ul>
                </div>
              )}
              {c.symptoms.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-foreground">Symptoms</p>
                  <ul className="ml-5 list-disc text-sm text-muted-foreground">
                    {c.symptoms.map((x, j) => <li key={j}>{x}</li>)}
                  </ul>
                </div>
              )}
              {c.fixes.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-foreground">How to fix (step-by-step)</p>
                  <ol className="ml-5 list-decimal text-sm text-muted-foreground">
                    {c.fixes.map((x, j) => <li key={j}>{x}</li>)}
                  </ol>
                </div>
              )}
              {c.estimatedRepairCost && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Estimated repair cost:</span> {c.estimatedRepairCost}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {result.seeMechanic && (
        <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Wrench className="h-4 w-4" /> See a mechanic
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {result.mechanicReason || "This issue needs a qualified mechanic to inspect and repair safely."}
          </p>
        </div>
      )}

      {result.references.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">Reference guides & wiring diagrams</h3>
          <ul className="mt-2 space-y-1.5">
            {result.references.map((r, i) => (
              <li key={i}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {r.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
