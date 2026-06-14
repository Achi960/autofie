// Online/last-seen helpers based on profiles.last_seen_at heartbeat.
const ONLINE_WINDOW_MS = 90_000; // user counts as online if seen within 90s

export function isOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

export function lastSeenLabel(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return "Offline";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < ONLINE_WINDOW_MS) return "Online";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Last seen ${days}d ago`;
  return `Last seen on ${new Date(lastSeenAt).toLocaleDateString()}`;
}

// Lazy single AudioContext for short "ploom" notification beeps
let _ctx: AudioContext | null = null;
export function playMessageBeep() {
  try {
    if (typeof window === "undefined") return;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    _ctx = _ctx ?? new Ctx();
    const ctx = _ctx!;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(540, now + 0.18);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    o.connect(g).connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.35);
  } catch { /* ignore */ }
}
