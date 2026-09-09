import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATEGORY_SLUGS = [
  "car",
  "motorcycle",
  "bus",
  "truck",
  "heavy_equipment",
  "parts",
  "accessories",
  "services",
] as const;

const ReviewInput = z.object({
  category: z.enum(CATEGORY_SLUGS),
  make: z.string().trim().max(60).default(""),
  model: z.string().trim().max(60).default(""),
  title: z.string().trim().max(160).default(""),
  description: z.string().trim().max(2000).default(""),
  year: z.string().trim().max(10).default(""),
  colour: z.string().trim().max(40).default(""),
  knownMakes: z.array(z.string()).max(400).default([]),
  knownModels: z.array(z.string()).max(600).default([]),
});

export type ListingReview = {
  make: string;
  model: string;
  year: string;
  colour: string;
  category: (typeof CATEGORY_SLUGS)[number];
  notes: string[];
};

const SYSTEM_PROMPT = `You are AutoFie's listing validator for a Ghanaian vehicle marketplace.
A dealer typed a make/brand and a model that may not exist in our dropdown lists, and may contain
spelling mistakes. You must clean it up.

Rules:
1. Correct spelling and capitalisation of the make/brand and model to the REAL manufacturer spelling.
   Examples: "kia morning" -> make "Kia", model "Morning"; "toyta corrola" -> "Toyota" / "Corolla";
   "benz c200" -> "Mercedes" / "C200"; "haujue" -> "Haojue"; "yahama" -> "Yamaha".
2. If the model the user typed actually belongs to a different make, fix the make.
3. If the typed value already matches an entry in the provided known lists (case-insensitively),
   return that known entry EXACTLY as written in the list.
4. Never invent a model that the user did not type. If you cannot confidently correct it,
   return the user's text with only capitalisation tidied.
5. Choose the best category slug for what is being sold, from exactly this list:
   car, motorcycle, bus, truck, heavy_equipment, parts, accessories, services.
   - car: saloons, SUVs, pickups, private vehicles
   - motorcycle: motorbikes, scooters, tricycles/aboboyaa
   - bus: minibuses, Hiace/Urvan/Sprinter passenger buses, coaches
   - truck: tipper, cargo trucks, trailers, tractor heads
   - heavy_equipment: excavators, bulldozers, forklifts, graders, cranes
   - parts: spare parts, engines, gearboxes, body panels, tyres
   - accessories: stereos, alarms, mats, rims (aftermarket add-ons)
   - services: repair, spraying, towing, workshops, car hire
   Only change the category when the listing clearly does not belong to the one chosen.
6. If the make, model, year or colour fields are empty, EXTRACT them from the title and
   description the dealer typed. Example: title "kia morningg 2009 red" ->
   make "Kia", model "Morning", year "2009", colour "Red". Never invent values that are
   not implied by the text; leave them as empty strings when unknown. Year must be 4 digits.
7. "notes": short, plain-English sentences describing every correction you made (max 4).
   Empty array when nothing changed.

Reply with ONLY valid JSON:
{"make": string, "model": string, "year": string, "colour": string, "category": string, "notes": string[]}`;

export const reviewListingDetails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data }): Promise<ListingReview> => {
    const fallback: ListingReview = {
      make: data.make,
      model: data.model,
      year: data.year,
      colour: data.colour,
      category: data.category,
      notes: [],
    };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return fallback;

    const userText = [
      `Chosen category: ${data.category}`,
      `Make/brand typed: ${data.make || "(none)"}`,
      `Model typed: ${data.model || "(none)"}`,
      `Year: ${data.year || "(none)"}`,
      `Colour: ${data.colour || "(none)"}`,
      `Title: ${data.title || "(none)"}`,
      `Description: ${data.description.slice(0, 600) || "(none)"}`,
      `Known makes for this category: ${data.knownMakes.slice(0, 300).join(", ") || "(none)"}`,
      `Known models for the typed make: ${data.knownModels.slice(0, 300).join(", ") || "(none)"}`,
    ].join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userText },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return fallback;

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as Partial<ListingReview>;

      const category = (CATEGORY_SLUGS as readonly string[]).includes(String(parsed.category))
        ? (parsed.category as ListingReview["category"])
        : data.category;

      return {
        make: String(parsed.make ?? data.make).slice(0, 60) || data.make,
        model: String(parsed.model ?? data.model).slice(0, 60) || data.model,
        year: (String(parsed.year ?? "").match(/\d{4}/)?.[0] ?? data.year),
        colour: String(parsed.colour ?? data.colour).slice(0, 40) || data.colour,
        category,
        notes: Array.isArray(parsed.notes) ? parsed.notes.map(String).slice(0, 4) : [],
      };
    } catch {
      return fallback;
    }
  });
