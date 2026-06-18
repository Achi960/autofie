import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Car,
  Wrench,
  Gauge,
  Ruler,
  Fuel,
  DollarSign,
  MapPin,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Flag,
  ListChecks,
  AlertCircle,
} from "lucide-react";
import { decodeVin, type VinDecodeResult, type VinAiReport } from "@/lib/vin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/vin")({
  component: VinPage,
  head: () => ({
    meta: [
      { title: "VIN Decoder & Full Vehicle Report — AutoFie Ghana" },
      {
        name: "description",
        content:
          "The world's most complete free VIN decoder, tuned for Ghana. Decode any 17-character VIN and get full factory specs, known issues, recalls, maintenance schedule, Ghana market price in GHS, spare-parts availability and more.",
      },
      { property: "og:title", content: "Free VIN Decoder — End-to-End Report — AutoFie Ghana" },
      {
        property: "og:description",
        content:
          "Decode any VIN and get an exhaustive AI-powered report: specs, recalls, common faults, Ghana market price, spare parts, and a buyer checklist.",
      },
    ],
  }),
});

function VinPage() {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VinDecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setResult(null);
    const v = vin.trim().toUpperCase();
    if (v.length !== 17) {
      setError("A valid VIN is exactly 17 characters (no I, O or Q).");
      return;
    }
    setLoading(true);
    try {
      const r = await decodeVin({ data: { vin: v } });
      setResult(r);
      if (!r.valid) toast.warning(r.errorText ?? "VIN could not be fully decoded");
      else if (r.aiError) toast.warning("Full AI report could not load — showing factory specs only.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> NHTSA factory data + AutoFie AI deep report
          </div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">VIN Decoder &amp; Full Vehicle Report</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            One search, everything you need. Specs, known issues, recalls, OEM maintenance, Ghana market
            price in GHS, spare-parts availability and a full buyer checklist — no other website needed.
          </p>

          <form onSubmit={lookup} className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
            <Input
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 17))}
              placeholder="e.g. 1HGBH41JXMN109186"
              className="h-12 flex-1 font-mono text-base tracking-wider"
              maxLength={17}
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" size="lg" disabled={loading} className="h-12 px-6">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Decode VIN
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {loading && (
            <p className="mt-3 text-xs text-muted-foreground">
              Pulling factory data and generating the full AI report — takes 5-15 seconds…
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8">
        {!result && !loading && <EmptyState />}
        {result && <ResultView r={result} />}
      </section>

      <SiteFooter />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <Car className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">What you&apos;ll get in one report</h2>
          <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            <li>• Year, make, model, trim &amp; brand logo</li>
            <li>• Full engine specs (oil, plugs, belt/chain)</li>
            <li>• 0-60, top speed, MPG, tank, range</li>
            <li>• Dimensions, weights, towing, cargo</li>
            <li>• Safety ratings &amp; airbag count</li>
            <li>• Known issues with repair cost</li>
            <li>• Recalls &amp; OEM maintenance schedule</li>
            <li>• Ghana market price in GHS</li>
            <li>• Spare parts availability (Suame / Abossey Okai)</li>
            <li>• Buyer checklist &amp; red flags</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

function ResultView({ r }: { r: VinDecodeResult }) {
  const s = r.summary;
  const ai = r.ai;
  const heading = [s.year, s.make, s.model, s.trim].filter(Boolean).join(" ") || "Decoded vehicle";

  const factoryRows: { label: string; value: string }[] = [
    { label: "Year", value: s.year },
    { label: "Make", value: s.make },
    { label: "Model", value: s.model },
    { label: "Trim / Series", value: [s.trim, s.series].filter(Boolean).join(" · ") },
    { label: "Body class", value: s.bodyClass },
    { label: "Vehicle type", value: s.vehicleType },
    { label: "Engine", value: s.engine },
    { label: "Fuel type", value: s.fuelType },
    { label: "Transmission", value: s.transmission },
    { label: "Drive type", value: s.driveType },
    { label: "Doors", value: s.doors },
    { label: "GVWR", value: s.gvwr },
    { label: "Manufacturer", value: s.manufacturer },
    { label: "Plant", value: [s.plantCompanyName, s.plantCity, s.plantCountry].filter(Boolean).join(" · ") },
  ].filter((row) => row.value);

  const recallUrl = `https://www.nhtsa.gov/recalls?vin=${encodeURIComponent(r.vin)}`;
  const carfaxUrl = `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=AUTOFIE&vin=${encodeURIComponent(r.vin)}`;
  const autocheckUrl = `https://www.autocheck.com/vehiclehistory/autocheck/en/vinbasics?vin=${encodeURIComponent(r.vin)}`;
  const imageQ = ai?.imageSearchQuery || heading;
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(imageQ)}`;

  return (
    <div className="space-y-4">
      {/* Header card with brand logo */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/40 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              {ai?.brand?.logoUrl && (
                <img
                  src={ai.brand.logoUrl}
                  alt={`${ai.brand.name} logo`}
                  className="h-14 w-14 rounded-lg border bg-white object-contain p-1"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              )}
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">VIN</p>
                <p className="font-mono text-sm sm:text-base">{r.vin}</p>
                <h2 className="mt-2 text-xl font-bold sm:text-2xl">{heading}</h2>
                {ai?.brand?.country && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ai.brand.name} · {ai.brand.country}
                  </p>
                )}
              </div>
            </div>
            {r.valid ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Decoded
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Partial
              </span>
            )}
          </div>
          {!r.valid && r.errorText && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{r.errorText}</p>
          )}
        </div>
      </Card>

      {/* AI summaries */}
      {ai && (
        <div className="grid gap-4 md:grid-cols-2">
          <Section icon={Car} title="Summary for buyers">
            <p className="text-sm text-muted-foreground">{ai.buyerSummary}</p>
          </Section>
          <Section icon={Wrench} title="Summary for mechanics">
            <p className="text-sm text-muted-foreground">{ai.mechanicSummary}</p>
          </Section>
        </div>
      )}

      {ai?.vehicleOverview && (
        <Section icon={Car} title={`About this ${ai.generation || "generation"}`}>
          <p className="text-sm text-muted-foreground">{ai.vehicleOverview}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {ai.productionYears && <Badge variant="secondary">Production: {ai.productionYears}</Badge>}
            {ai.bodyStyles?.map((b) => <Badge key={b} variant="outline">{b}</Badge>)}
          </div>
          {ai.trims?.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-semibold">Trims:</span> {ai.trims.join(", ")}
            </p>
          )}
        </Section>
      )}

      {/* Factory data */}
      <Section icon={ShieldCheck} title="Factory data (NHTSA vPIC)">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {factoryRows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {ai && (
        <>
          <Section icon={Wrench} title="Engine specifications">
            <SpecGrid spec={ai.engineSpecs} />
          </Section>

          <Section icon={Gauge} title="Performance">
            <SpecGrid spec={ai.performance} />
          </Section>

          <Section icon={Ruler} title="Dimensions &amp; capacities">
            <SpecGrid spec={ai.dimensions} />
          </Section>

          <Section icon={ShieldCheck} title="Safety">
            <SpecGrid spec={ai.safety} />
          </Section>

          {ai.knownIssues?.length > 0 && (
            <Section icon={AlertCircle} title="Known issues for this model">
              <ul className="space-y-3">
                {ai.knownIssues.map((it, i) => (
                  <li key={i} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{it.issue}</p>
                      <SeverityBadge level={it.severity} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Fix:</span> {it.fix}</p>
                    {it.estimatedCost && <p className="mt-0.5 text-xs text-muted-foreground">Est. cost: {it.estimatedCost}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {ai.recalls?.length > 0 && (
            <Section icon={AlertTriangle} title="Recalls">
              <ul className="space-y-2">
                {ai.recalls.map((rc, i) => (
                  <li key={i} className="rounded-lg border p-3">
                    <p className="text-sm font-semibold">{rc.title} {rc.year && <span className="text-xs font-normal text-muted-foreground">({rc.year})</span>}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{rc.description}</p>
                  </li>
                ))}
              </ul>
              <a
                href={recallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Verify on NHTSA <ExternalLink className="h-3 w-3" />
              </a>
            </Section>
          )}

          {ai.maintenanceSchedule?.length > 0 && (
            <Section icon={CalendarClock} title="OEM maintenance schedule">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="pb-2 pr-4">Interval</th><th className="pb-2">Task</th></tr>
                  </thead>
                  <tbody>
                    {ai.maintenanceSchedule.map((m, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2 pr-4 font-medium whitespace-nowrap">{m.interval}</td>
                        <td className="py-2 text-muted-foreground">{m.task}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Section icon={DollarSign} title="Market value (USA)">
              <PriceBlock low={ai.marketValueUSD?.low} avg={ai.marketValueUSD?.average} high={ai.marketValueUSD?.high} notes={ai.marketValueUSD?.notes} />
            </Section>
            <Section icon={DollarSign} title="Market value (Ghana, GHS)">
              <PriceBlock low={ai.marketValueGhanaGHS?.low} avg={ai.marketValueGhanaGHS?.average} high={ai.marketValueGhanaGHS?.high} notes={ai.marketValueGhanaGHS?.notes} />
            </Section>
          </div>

          <Section icon={MapPin} title="Ghana context">
            <SpecGrid
              spec={{
                availability: ai.ghanaContext?.availabilityInGhana,
                spareParts: ai.ghanaContext?.sparePartsAvailability,
                fuel: ai.ghanaContext?.fuelCompatibility,
                roads: ai.ghanaContext?.suitabilityForRoads,
                insurance: ai.ghanaContext?.insuranceCategory,
                duty: ai.ghanaContext?.duty,
              }}
            />
          </Section>

          {(ai.prosCons?.pros?.length > 0 || ai.prosCons?.cons?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              <Section icon={CheckCircle2} title="Pros">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {ai.prosCons.pros.map((p, i) => (
                    <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{p}</span></li>
                  ))}
                </ul>
              </Section>
              <Section icon={XCircle} title="Cons">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {ai.prosCons.cons.map((c, i) => (
                    <li key={i} className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /><span>{c}</span></li>
                  ))}
                </ul>
              </Section>
            </div>
          )}

          {ai.comparableCars?.length > 0 && (
            <Section icon={Car} title="Comparable cars">
              <div className="flex flex-wrap gap-2">
                {ai.comparableCars.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            </Section>
          )}

          {ai.buyerChecklist?.length > 0 && (
            <Section icon={ListChecks} title="Buyer's inspection checklist">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {ai.buyerChecklist.map((c, i) => (
                  <li key={i} className="flex gap-2"><span className="mt-0.5 text-primary">□</span><span>{c}</span></li>
                ))}
              </ul>
            </Section>
          )}

          {ai.redFlags?.length > 0 && (
            <Section icon={Flag} title="Red flags — walk away if you see these">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {ai.redFlags.map((c, i) => (
                  <li key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /><span>{c}</span></li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {/* External history reports */}
      <Section icon={Fuel} title="More history checks">
        <p className="text-sm text-muted-foreground">
          Cross-check accident, title and odometer records with these external services.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <HistoryLink href={recallUrl} title="NHTSA Recalls" subtitle="Free · official" />
          <HistoryLink href={carfaxUrl} title="Carfax Report" subtitle="Paid · US imports" />
          <HistoryLink href={autocheckUrl} title="AutoCheck Report" subtitle="Paid · auction history" />
          <HistoryLink href={googleImagesUrl} title="See photos" subtitle="Google Images" />
        </div>
      </Section>

      {ai?.references && ai.references.length > 0 && (
        <Section icon={ExternalLink} title="References">
          <ul className="space-y-1.5 text-sm">
            {ai.references.map((ref, i) => (
              <li key={i}>
                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {ref.title}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      {children}
    </Card>
  );
}

function SpecGrid({ spec }: { spec: Record<string, string | undefined> }) {
  const entries = Object.entries(spec).filter(([, v]) => v && String(v).trim());
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No data available.</p>;
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-col">
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{labelize(k)}</dt>
          <dd className="text-sm font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function labelize(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function SeverityBadge({ level }: { level: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    high: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  };
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${map[level]}`}>{level}</span>;
}

function PriceBlock({ low, avg, high, notes }: { low?: string; avg?: string; high?: string; notes?: string }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Low</p>
          <p className="mt-1 text-sm font-bold">{low || "—"}</p>
        </div>
        <div className="rounded-lg border bg-primary/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Average</p>
          <p className="mt-1 text-sm font-bold text-primary">{avg || "—"}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">High</p>
          <p className="mt-1 text-sm font-bold">{high || "—"}</p>
        </div>
      </div>
      {notes && <p className="mt-2 text-xs text-muted-foreground">{notes}</p>}
    </>
  );
}

function HistoryLink({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-2 rounded-lg border bg-card p-3 hover:border-primary hover:bg-primary/5"
    >
      <div>
        <p className="text-sm font-semibold group-hover:text-primary">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </a>
  );
}
