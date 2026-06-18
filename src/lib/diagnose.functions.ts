import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DiagnoseInput = z.object({
  description: z.string().trim().min(2, "Please describe the problem or enter a code.").max(2000),
  vehicleType: z.enum(["car", "motorcycle", "bus", "truck", "tractor", "unspecified"]).default("unspecified"),
  engineType: z.enum(["manual", "automatic", "electric", "unspecified"]).default("unspecified"),
  imageDataUrl: z.string().startsWith("data:image/").max(8_000_000).optional().nullable(),
});

export type OBDCodeInfo = {
  code: string;
  meaning: string;
  system: string; // e.g. "Powertrain - Fuel & Air Metering"
  commonCauses: string[];
  symptoms: string[];
  fixes: string[];
  estimatedRepairCost?: string;
  severity: "low" | "medium" | "high";
};

export type DiagnoseReference = {
  title: string;
  url: string;
};

export type DiagnoseResult = {
  likelyCause: string;
  diySteps: string[];
  seeMechanic: boolean;
  mechanicReason: string;
  severity: "low" | "medium" | "high";
  obdCodes: OBDCodeInfo[];
  references: DiagnoseReference[];
};

const SYSTEM_PROMPT = `You are AutoFie Diagnose — a professional, end-to-end vehicle diagnostic assistant.
You handle cars, motorcycles, buses, trucks, and tractors. You are an expert in:
- OBD-II / EOBD diagnostic trouble codes (DTCs): generic P/B/C/U codes AND manufacturer-specific codes
  (Toyota, Honda, Nissan, Ford, GM/Chevy, VW/Audi, BMW, Mercedes, Hyundai/Kia, Mazda, Mitsubishi, etc.)
- Engine, transmission, electrical, ABS/SRS, HVAC, emissions, and fuel systems
- Dashboard warning lights and what they mean
- Wiring diagrams, sensor locations, and component testing

INPUT may include:
- A plain-language description (noise, smell, behavior, dashboard light)
- One or more DTC codes like "P0420", "P0171 P0174", "U0100", "C1201", "B1318"
- An attached photo (dashboard cluster, leak, damage, component)

DETECT every diagnostic trouble code in the description (regex pattern like [PBCU][0-9]{4}) and ALSO interpret
codes the user describes loosely ("check engine code 420"). For EACH detected code return a rich entry in
"obdCodes" with:
  - code: normalized (uppercase, e.g. "P0420")
  - meaning: official SAE / manufacturer definition in plain language
  - system: which subsystem (e.g. "Powertrain — Catalyst System Efficiency Below Threshold (Bank 1)")
  - commonCauses: ordered list, MOST LIKELY first (4-7 items)
  - symptoms: what the driver will notice (3-5 items)
  - fixes: step-by-step troubleshooting from cheapest/safest to most involved (5-8 items)
  - estimatedRepairCost: rough USD range, e.g. "$150 – $1,200" (or "Varies")
  - severity: low | medium | high

In "references", suggest 2-4 high-quality web resources where the user can dig deeper:
  - OBD-Codes.com pages (e.g. https://www.obd-codes.com/p0420)
  - RepairPal (https://repairpal.com/obd-ii-code-p0420)
  - AutoZone repair guides, Haynes/Chilton, manufacturer TSB databases
  - YouTube how-to searches (https://www.youtube.com/results?search_query=P0420+diagnosis)
  - For wiring diagrams: AllData, Mitchell1, or "<vehicle> wiring diagram" Google Image search
Only include URLs you are confident exist. NEVER fabricate broken links.

For the OVERALL diagnosis:
1. "likelyCause": clear 2-5 sentence explanation tying the codes / symptoms / photo together.
2. "diySteps": ONLY safe DIY checks (tighten gas cap, read codes, check fluid level cold, inspect for
   obvious leaks, check fuses, clean MAF sensor with proper cleaner). Leave empty if nothing is safe.
3. "seeMechanic" + "mechanicReason": true for ANY brake, steering, airbag, transmission internals,
   engine internals, fuel leak, electrical short, overheating, SRS, or safety-critical issue.
4. "severity": low (cosmetic), medium (drive carefully, book soon), high (do not drive — tow it).

Be honest about uncertainty. Never guess at safety-critical fixes.

Reply with ONLY valid JSON matching this exact schema (omit no keys, use [] for empty arrays):
{
  "likelyCause": string,
  "diySteps": string[],
  "seeMechanic": boolean,
  "mechanicReason": string,
  "severity": "low" | "medium" | "high",
  "obdCodes": [
    {
      "code": string,
      "meaning": string,
      "system": string,
      "commonCauses": string[],
      "symptoms": string[],
      "fixes": string[],
      "estimatedRepairCost": string,
      "severity": "low" | "medium" | "high"
    }
  ],
  "references": [ { "title": string, "url": string } ]
}`;

export const diagnoseVehicle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DiagnoseInput.parse(input))
  .handler(async ({ data }): Promise<DiagnoseResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const userText = [
      `Vehicle type: ${data.vehicleType}`,
      `Engine/transmission: ${data.engineType}`,
      `Problem / codes from user: ${data.description}`,
    ].join("\n");

    const userContent: Array<Record<string, unknown>> = [{ type: "text", text: userText }];
    if (data.imageDataUrl) {
      userContent.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Our AI tool is busy right now. Please try again in a minute.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please contact AutoFie support.");
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status}). ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    let parsed: Partial<DiagnoseResult> & { severity?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned an unreadable response. Please try again.");
    }

    const validSev = (s: unknown): "low" | "medium" | "high" =>
      s === "low" || s === "medium" || s === "high" ? s : "medium";

    const obdCodes: OBDCodeInfo[] = Array.isArray(parsed.obdCodes)
      ? parsed.obdCodes.slice(0, 8).map((c) => ({
          code: String(c?.code ?? "").toUpperCase().slice(0, 12),
          meaning: String(c?.meaning ?? ""),
          system: String(c?.system ?? ""),
          commonCauses: Array.isArray(c?.commonCauses) ? c.commonCauses.map(String).slice(0, 10) : [],
          symptoms: Array.isArray(c?.symptoms) ? c.symptoms.map(String).slice(0, 8) : [],
          fixes: Array.isArray(c?.fixes) ? c.fixes.map(String).slice(0, 10) : [],
          estimatedRepairCost: c?.estimatedRepairCost ? String(c.estimatedRepairCost) : undefined,
          severity: validSev(c?.severity),
        })).filter((c) => c.code)
      : [];

    const references: DiagnoseReference[] = Array.isArray(parsed.references)
      ? parsed.references.slice(0, 6)
          .map((r) => ({ title: String(r?.title ?? "").slice(0, 120), url: String(r?.url ?? "") }))
          .filter((r) => r.title && /^https?:\/\//i.test(r.url))
      : [];

    return {
      likelyCause: String(parsed.likelyCause ?? "Unable to determine from the information provided."),
      diySteps: Array.isArray(parsed.diySteps) ? parsed.diySteps.map(String).slice(0, 12) : [],
      seeMechanic: Boolean(parsed.seeMechanic ?? true),
      mechanicReason: String(parsed.mechanicReason ?? ""),
      severity: validSev(parsed.severity),
      obdCodes,
      references,
    };
  });
