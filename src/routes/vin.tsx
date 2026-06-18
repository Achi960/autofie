import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Search, ShieldCheck, AlertTriangle, ExternalLink, Car } from "lucide-react";
import { decodeVin, type VinDecodeResult } from "@/lib/vin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/vin")({
  component: VinPage,
  head: () => ({
    meta: [
      { title: "VIN Decoder & Vehicle History Check — AutoFie Ghana" },
      {
        name: "description",
        content:
          "Decode any 17-character VIN — US, Japan, UK, EU and worldwide cars from 1981 to today. Get factory specs, engine, transmission, plant of manufacture and recall info, free, on AutoFie.",
      },
      { property: "og:title", content: "Free VIN Decoder — AutoFie Ghana" },
      {
        property: "og:description",
        content:
          "Enter a VIN and instantly see the car's year, make, model, engine, factory and recall history. Trusted data from the US NHTSA vPIC database.",
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
    } catch (err: any) {
      setError(err?.message ?? "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Powered by US NHTSA vPIC — free & official
          </div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">VIN Decoder &amp; History Check</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Buying a used car? Enter the 17-character VIN to instantly see the year, make, model,
            engine, transmission, factory of manufacture and known recalls. Works for US, Japan,
            UK, EU and most other manufacturers from 1981 onwards.
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
          <p className="mt-3 text-xs text-muted-foreground">
            The VIN is usually on the dashboard near the windshield, inside the driver's door jamb,
            or on the registration document.
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-3xl px-4 py-8">
        {!result && !loading && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Car className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">What you'll get</h2>
                <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  <li>• Year, make, model &amp; trim</li>
                  <li>• Engine size, cylinders &amp; horsepower</li>
                  <li>• Transmission &amp; drive type</li>
                  <li>• Body class &amp; number of doors</li>
                  <li>• Plant country, city &amp; manufacturer</li>
                  <li>• Direct link to NHTSA recall records</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {result && <ResultView r={result} />}
      </section>

      <SiteFooter />
    </div>
  );
}

function ResultView({ r }: { r: VinDecodeResult }) {
  const s = r.summary;
  const heading = [s.year, s.make, s.model, s.trim].filter(Boolean).join(" ") || "Decoded vehicle";

  const rows: { label: string; value: string }[] = [
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

  const recallUrl = s.make && s.model && s.year
    ? `https://www.nhtsa.gov/recalls?vin=${encodeURIComponent(r.vin)}`
    : `https://www.nhtsa.gov/recalls`;

  const carfaxUrl = `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=AUTOFIE&vin=${encodeURIComponent(r.vin)}`;
  const autocheckUrl = `https://www.autocheck.com/vehiclehistory/autocheck/en/vinbasics?vin=${encodeURIComponent(r.vin)}`;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/40 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">VIN</p>
              <p className="font-mono text-sm sm:text-base">{r.vin}</p>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">{heading}</h2>
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

        <dl className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Check the history</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-check with the official US safety database, plus paid history reports that cover
          accident, title and odometer records (most US/Japan imports show up).
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <HistoryLink href={recallUrl} title="NHTSA Recalls" subtitle="Free · official" />
          <HistoryLink href={carfaxUrl} title="Carfax Report" subtitle="Paid · most US imports" />
          <HistoryLink href={autocheckUrl} title="AutoCheck Report" subtitle="Paid · auction history" />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Buyer's tip</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Always confirm the VIN on the dashboard, door jamb and engine bay all match each other
          and the registration. If anything differs, walk away — it may be a re-VIN'd or stolen
          vehicle. Then use our <a className="font-medium text-primary hover:underline" href="/diagnose">AI Diagnose</a> to
          check any error codes before buying.
        </p>
      </Card>
    </div>
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
