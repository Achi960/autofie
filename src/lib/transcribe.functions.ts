import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TranscribeInput = z.object({
  audioBase64: z.string().min(20).max(15_000_000),
  format: z.enum(["webm", "mp4", "m4a", "wav", "mp3", "ogg"]).default("webm"),
  language: z.enum(["english", "twi", "hausa"]).default("english"),
});

const LANG_LABEL: Record<string, string> = {
  english: "English",
  twi: "Akan Twi (a Ghanaian language)",
  hausa: "Hausa (a West African language)",
};

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranscribeInput.parse(input))
  .handler(async ({ data }): Promise<{ text: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const langLabel = LANG_LABEL[data.language];
    const prompt = `Transcribe the speech in this audio. The speaker is talking in ${langLabel}. Reply with ONLY the transcript text in ${langLabel}, with no quotes, no labels, no translation, and no extra commentary. If you cannot make out any speech, reply with an empty string.`;

    // Gemini's input_audio format expects the container name
    const format = data.format === "mp4" ? "m4a" : data.format;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "input_audio", input_audio: { data: data.audioBase64, format } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Voice service is busy. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please contact AutoFie support.");
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Transcription failed (${res.status}). ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    return { text };
  });
