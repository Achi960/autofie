import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DiagnoseInput = z.object({
  description: z.string().trim().min(5, "Please describe the problem in a bit more detail.").max(2000),
  vehicleType: z.enum(["car", "motorcycle", "bus", "truck", "tractor", "unspecified"]).default("unspecified"),
  engineType: z.enum(["manual", "automatic", "electric", "unspecified"]).default("unspecified"),
  imageDataUrl: z.string().startsWith("data:image/").max(8_000_000).optional().nullable(),
});

export type DiagnoseResult = {
  likelyCause: string;
  diySteps: string[];
  seeMechanic: boolean;
  mechanicReason: string;
  severity: "low" | "medium" | "high";
};

const SYSTEM_PROMPT = `You are an expert vehicle diagnostic assistant for AutoFie, a Ghana vehicle marketplace.
A user will describe a problem with their car, motorcycle, bus, truck, or tractor, and may include a photo
(often a dashboard warning light, leak, or visible damage). Your job:

1. Identify the most LIKELY cause in plain language (2-4 sentences).
2. If, and ONLY if, the issue is safe for a non-mechanic to handle (e.g. low washer fluid, loose fuel cap,
   replacing a wiper blade, topping up coolant when cold, checking tire pressure, replacing a cabin air filter),
   provide clear, numbered DIY steps. Otherwise leave diySteps empty.
3. For ANY issue involving brakes, steering, airbags, engine internals, transmission, electrical wiring,
   suspension, fuel system leaks, smoke, overheating, ABS, or anything that affects safety — set seeMechanic=true
   and explain briefly why a professional must handle it.
4. Rate severity: "low" (cosmetic / minor), "medium" (drive carefully and book a mechanic soon),
   "high" (do not drive; tow or call a mechanic).

Be honest about uncertainty. Never guess at safety-critical fixes. Reply ONLY with valid JSON matching this schema:
{
  "likelyCause": string,
  "diySteps": string[],
  "seeMechanic": boolean,
  "mechanicReason": string,
  "severity": "low" | "medium" | "high"
}`;

export const diagnoseVehicle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DiagnoseInput.parse(input))
  .handler(async ({ data }): Promise<DiagnoseResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const userText = [
      `Vehicle type: ${data.vehicleType}`,
      `Engine/transmission: ${data.engineType}`,
      `Problem description: ${data.description}`,
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
    let parsed: DiagnoseResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned an unreadable response. Please try again.");
    }

    return {
      likelyCause: String(parsed.likelyCause ?? "Unable to determine from the information provided."),
      diySteps: Array.isArray(parsed.diySteps) ? parsed.diySteps.map(String).slice(0, 12) : [],
      seeMechanic: Boolean(parsed.seeMechanic ?? true),
      mechanicReason: String(parsed.mechanicReason ?? ""),
      severity: (["low", "medium", "high"] as const).includes(parsed.severity) ? parsed.severity : "medium",
    };
  });
