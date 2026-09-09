import { supabase } from "@/integrations/supabase/client";

const SIGN_TTL = 60 * 60 * 6; // 6h — fewer round-trips, longer browser cache hits

const signedCache = new Map<string, { url: string; expires: number }>();

// Requests that arrive close together are batched into ONE signing call,
// so a grid of listing cards no longer fires dozens of separate requests.
type Waiter = { path: string; resolve: (v: string | null) => void };
const queue = new Map<string, Waiter[]>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

async function flush(bucket: string) {
  timers.delete(bucket);
  const waiters = queue.get(bucket) ?? [];
  queue.delete(bucket);
  if (!waiters.length) return;

  const paths = Array.from(new Set(waiters.map((w) => w.path)));
  const resolved = new Map<string, string>();

  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    try {
      const { data } = await supabase.storage.from(bucket).createSignedUrls(chunk, SIGN_TTL);
      for (const row of data ?? []) {
        if (row?.path && row.signedUrl) {
          resolved.set(row.path, row.signedUrl);
          signedCache.set(`${bucket}:${row.path}`, { url: row.signedUrl, expires: Date.now() + SIGN_TTL * 1000 });
        }
      }
    } catch {
      /* fall through — waiters get null */
    }
  }

  for (const w of waiters) w.resolve(resolved.get(w.path) ?? null);
}

export function signedUrl(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return Promise.resolve(null);
  const cached = signedCache.get(`${bucket}:${path}`);
  if (cached && cached.expires > Date.now() + 60_000) return Promise.resolve(cached.url);

  return new Promise((resolve) => {
    const waiters = queue.get(bucket) ?? [];
    waiters.push({ path, resolve });
    queue.set(bucket, waiters);
    if (!timers.has(bucket)) timers.set(bucket, setTimeout(() => void flush(bucket), 20));
  });
}

export async function signedUrls(bucket: string, paths: (string | null | undefined)[]): Promise<(string | null)[]> {
  return Promise.all(paths.map((p) => signedUrl(bucket, p)));
}

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}
