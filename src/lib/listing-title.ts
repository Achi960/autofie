/** Builds the standard AutoFie listing title: Make Model Year Colour. */
export function buildAutoTitle(parts: {
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  colour?: string | null;
}): string {
  const clean = (s: unknown) => String(s ?? "").replace(/_/g, " ").trim();
  const bits = [clean(parts.make), clean(parts.model), clean(parts.year), clean(parts.colour)].filter(Boolean);
  return bits.join(" ").slice(0, 120);
}
