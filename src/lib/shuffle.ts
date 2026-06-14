// Deterministic per-minute shuffle so the visible order changes ~every minute
// but stays stable within the same minute (avoids flicker on re-renders).
export function currentShuffleSeed(extra = 0): number {
  return (Math.floor(Date.now() / 60_000) + extra) >>> 0;
}

export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  let s = seed >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function shuffleByMinute<T>(arr: T[], extra = 0): T[] {
  return shuffleWithSeed(arr, currentShuffleSeed(extra));
}
