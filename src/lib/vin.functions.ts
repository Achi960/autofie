import { createServerFn } from "@tanstack/react-start";

// Free, no-key NHTSA vPIC API — decodes 17-char VINs for cars sold worldwide
// (covers US, Japan, UK, EU manufacturers from ~1981 onwards).
const VPIC_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

export type VinDecodeResult = {
  vin: string;
  valid: boolean;
  errorText?: string;
  summary: {
    year: string;
    make: string;
    model: string;
    trim: string;
    bodyClass: string;
    vehicleType: string;
    engine: string;
    fuelType: string;
    transmission: string;
    driveType: string;
    doors: string;
    plantCountry: string;
    plantCompanyName: string;
    plantCity: string;
    manufacturer: string;
    gvwr: string;
    series: string;
  };
  raw: Record<string, string>;
  ai?: VinAiReport | null;
  aiError?: string;
};

export type VinAiReport = {
  buyerSummary: string;
  mechanicSummary: string;
  brand: {
    name: string;
    website: string; // e.g. "toyota.com"
    logoUrl: string; // direct image URL
    country: string;
  };
  vehicleOverview: string;
  generation: string;
  productionYears: string;
  bodyStyles: string[];
  trims: string[];
  engineSpecs: {
    code: string;
    layout: string;
    displacement: string;
    horsepower: string;
    torque: string;
    compressionRatio: string;
    fuelSystem: string;
    aspiration: string;
    valvetrain: string;
    oilCapacity: string;
    oilType: string;
    sparkPlugGap: string;
    timingBeltOrChain: string;
  };
  performance: {
    zeroToSixty: string;
    topSpeed: string;
    fuelEconomyCity: string;
    fuelEconomyHwy: string;
    fuelTankCapacity: string;
    range: string;
  };
  dimensions: {
    length: string;
    width: string;
    height: string;
    wheelbase: string;
    groundClearance: string;
    curbWeight: string;
    cargoVolume: string;
    seating: string;
    towingCapacity: string;
  };
  safety: {
    overallRating: string;
    airbags: string;
    abs: string;
    stabilityControl: string;
    crashTestNotes: string;
  };
  knownIssues: { issue: string; severity: "low" | "medium" | "high"; fix: string; estimatedCost: string }[];
  recalls: { title: string; year: string; description: string }[];
  maintenanceSchedule: { interval: string; task: string }[];
  marketValueUSD: { low: string; average: string; high: string; notes: string };
  marketValueGhanaGHS: { low: string; average: string; high: string; notes: string };
  ghanaContext: {
    availabilityInGhana: string;
    sparePartsAvailability: string;
    fuelCompatibility: string;
    suitabilityForRoads: string;
    insuranceCategory: string;
    duty: string;
  };
  comparableCars: string[];
  prosCons: { pros: string[]; cons: string[] };
  buyerChecklist: string[];
  redFlags: string[];
  imageSearchQuery: string;
  references: { title: string; url: string }[];
};

function clean(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "not applicable" || s === "0") return "";
  return s;
}

const AI_SYSTEM_PROMPT = `You are AutoFie VIN Intelligence — the world's most thorough VIN report generator,
tuned for both global buyers and the Ghana (West Africa) used-car market.

You receive a decoded VIN (year, make, model, trim, engine, plant, etc.) and must
produce an EXHAUSTIVE, end-to-end report so the buyer never needs to visit another website.
Pull every relevant fact you know about this specific year/make/model/trim:
- Full factory specs (engine code, oil capacity & grade, spark plug gap, timing chain vs belt, transmission code)
- Performance (0-60, top speed, MPG city/hwy, tank capacity, range)
- Dimensions and weights (length, width, height, wheelbase, ground clearance, curb weight, cargo, towing, seating)
- Safety: NHTSA / Euro NCAP / JNCAP ratings, airbag count, ABS, ESC
- Every commonly reported reliability issue for this generation (engine, transmission, electrical, suspension)
  with realistic USD repair cost ranges and severity
- Known recalls (year + summary)
- OEM maintenance schedule (oil, plugs, timing belt/chain, transmission fluid, coolant, brakes)
- Market value: realistic USED price ranges in USD (US market) AND Ghana cedis (GHS) — Ghana imports are
  typically 10-30% above US Black Book due to shipping + 5-35% CIF duty
- Ghana-specific context: how common is this car in Ghana, are spare parts available at Abossey Okai /
  Suame Magazine, does the engine tolerate Ghana's 91-octane fuel, ground clearance vs Ghana roads,
  insurance category, approximate import duty bracket
- Pros / cons, comparable competitors, buyer checklist, red flags to inspect

For the brand logo, give the brand's official short domain (e.g. "toyota.com", "honda.com", "vw.com")
in brand.website. We render the logo from "https://logo.clearbit.com/<website>".

Reply with ONLY valid JSON matching this exact schema (every key required, use "" or [] when unknown).
Be specific with numbers, not vague. Never invent recalls or URLs. URLs must start with https://.

{
  "buyerSummary": string (3-5 sentences, plain English, for a Ghanaian buyer),
  "mechanicSummary": string (3-5 sentences, technical, for a mechanic at Suame/Abossey Okai),
  "brand": { "name": string, "website": string, "logoUrl": string, "country": string },
  "vehicleOverview": string (1 paragraph about this specific generation),
  "generation": string,
  "productionYears": string,
  "bodyStyles": string[],
  "trims": string[],
  "engineSpecs": {
    "code": string, "layout": string, "displacement": string, "horsepower": string, "torque": string,
    "compressionRatio": string, "fuelSystem": string, "aspiration": string, "valvetrain": string,
    "oilCapacity": string, "oilType": string, "sparkPlugGap": string, "timingBeltOrChain": string
  },
  "performance": {
    "zeroToSixty": string, "topSpeed": string, "fuelEconomyCity": string, "fuelEconomyHwy": string,
    "fuelTankCapacity": string, "range": string
  },
  "dimensions": {
    "length": string, "width": string, "height": string, "wheelbase": string, "groundClearance": string,
    "curbWeight": string, "cargoVolume": string, "seating": string, "towingCapacity": string
  },
  "safety": {
    "overallRating": string, "airbags": string, "abs": string, "stabilityControl": string,
    "crashTestNotes": string
  },
  "knownIssues": [ { "issue": string, "severity": "low"|"medium"|"high", "fix": string, "estimatedCost": string } ],
  "recalls": [ { "title": string, "year": string, "description": string } ],
  "maintenanceSchedule": [ { "interval": string, "task": string } ],
  "marketValueUSD": { "low": string, "average": string, "high": string, "notes": string },
  "marketValueGhanaGHS": { "low": string, "average": string, "high": string, "notes": string },
  "ghanaContext": {
    "availabilityInGhana": string, "sparePartsAvailability": string, "fuelCompatibility": string,
    "suitabilityForRoads": string, "insuranceCategory": string, "duty": string
  },
  "comparableCars": string[],
  "prosCons": { "pros": string[], "cons": string[] },
  "buyerChecklist": string[],
  "redFlags": string[],
  "imageSearchQuery": string,
  "references": [ { "title": string, "url": string } ]
}`;

async function enrichWithAi(s: VinDecodeResult["summary"], vin: string): Promise<VinAiReport | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;

  const userPrompt = `Decoded VIN: ${vin}
Year: ${s.year}
Make: ${s.make}
Model: ${s.model}
Trim/Series: ${[s.trim, s.series].filter(Boolean).join(" ")}
Body: ${s.bodyClass}
Engine: ${s.engine}
Fuel: ${s.fuelType}
Transmission: ${s.transmission}
Drive: ${s.driveType}
Doors: ${s.doors}
Manufacturer: ${s.manufacturer}
Plant: ${[s.plantCompanyName, s.plantCity, s.plantCountry].filter(Boolean).join(", ")}

Produce the FULL JSON report for a Ghana-based buyer. Include realistic Ghana market price in GHS
(use approx 1 USD = 15 GHS, plus 15-25% import + duty markup), known issues for this exact generation,
recalls, OEM maintenance, full specs and spare-parts availability at Suame/Abossey Okai.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI enrichment failed (${res.status})`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(content) as VinAiReport;

  // Normalize brand logo via Clearbit
  if (parsed.brand?.website && !parsed.brand.logoUrl) {
    parsed.brand.logoUrl = `https://logo.clearbit.com/${parsed.brand.website}`;
  } else if (parsed.brand?.website) {
    parsed.brand.logoUrl = `https://logo.clearbit.com/${parsed.brand.website}`;
  }
  return parsed;
}

export const decodeVin = createServerFn({ method: "POST" })
  .inputValidator((input: { vin: string; year?: string }) => {
    const vin = String(input?.vin ?? "").trim().toUpperCase();
    if (vin.length !== 17) throw new Error("VIN must be exactly 17 characters");
    if (/[IOQ]/.test(vin)) throw new Error("VIN cannot contain I, O, or Q");
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new Error("Invalid VIN characters");
    return { vin, year: input?.year?.trim() || undefined };
  })
  .handler(async ({ data }): Promise<VinDecodeResult> => {
    const url = `${VPIC_URL}/${encodeURIComponent(data.vin)}?format=json${data.year ? `&modelyear=${encodeURIComponent(data.year)}` : ""}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`VIN service error (${res.status})`);
    const json = (await res.json()) as { Results?: Record<string, unknown>[] };
    const r = json.Results?.[0] ?? {};

    const errorCode = clean(r.ErrorCode);
    const errorText = clean(r.ErrorText);
    const valid = errorCode === "" || errorCode.startsWith("0");

    const raw: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      const s = clean(v);
      if (s) raw[k] = s;
    }

    const summary = {
      year: clean(r.ModelYear),
      make: clean(r.Make),
      model: clean(r.Model),
      trim: clean(r.Trim) || clean(r.Trim2),
      bodyClass: clean(r.BodyClass),
      vehicleType: clean(r.VehicleType),
      engine: [
        clean(r.DisplacementL) ? `${clean(r.DisplacementL)}L` : "",
        clean(r.EngineCylinders) ? `${clean(r.EngineCylinders)}-cyl` : "",
        clean(r.EngineConfiguration),
        clean(r.EngineHP) ? `${clean(r.EngineHP)} HP` : "",
      ].filter(Boolean).join(" · "),
      fuelType: clean(r.FuelTypePrimary),
      transmission: [clean(r.TransmissionStyle), clean(r.TransmissionSpeeds) ? `${clean(r.TransmissionSpeeds)}-speed` : ""].filter(Boolean).join(" · "),
      driveType: clean(r.DriveType),
      doors: clean(r.Doors),
      plantCountry: clean(r.PlantCountry),
      plantCompanyName: clean(r.PlantCompanyName),
      plantCity: clean(r.PlantCity),
      manufacturer: clean(r.Manufacturer),
      gvwr: clean(r.GVWR),
      series: clean(r.Series),
    };

    let ai: VinAiReport | null = null;
    let aiError: string | undefined;
    if (valid && summary.make && summary.model) {
      try {
        ai = await enrichWithAi(summary, data.vin);
      } catch (e) {
        aiError = e instanceof Error ? e.message : "AI enrichment failed";
      }
    }

    return {
      vin: data.vin,
      valid,
      errorText: valid ? undefined : errorText || "VIN could not be fully decoded",
      summary,
      raw,
      ai,
      aiError,
    };
  });
