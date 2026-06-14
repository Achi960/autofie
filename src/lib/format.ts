export function formatGHS(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "GH₵ —";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "GH₵ —";
  return "GH₵ " + n.toLocaleString("en-GH", { maximumFractionDigits: 0 });
}

export function formatMileage(km: number | null | undefined): string {
  if (km === null || km === undefined) return "—";
  return km.toLocaleString("en-GH") + " km";
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}
