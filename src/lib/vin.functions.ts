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
};

function clean(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "not applicable" || s === "0") return "";
  return s;
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
    // ErrorCode "0" = success; anything else (1, 6, 14…) means VIN couldn't be fully decoded
    const valid = errorCode === "" || errorCode.startsWith("0");

    const raw: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      const s = clean(v);
      if (s) raw[k] = s;
    }

    return {
      vin: data.vin,
      valid,
      errorText: valid ? undefined : errorText || "VIN could not be fully decoded",
      summary: {
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
      },
      raw,
    };
  });
