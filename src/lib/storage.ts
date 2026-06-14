import { supabase } from "@/integrations/supabase/client";

const SIGN_TTL = 60 * 60; // 1h

const signedCache = new Map<string, { url: string; expires: number }>();

export async function signedUrl(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const key = `${bucket}:${path}`;
  const cached = signedCache.get(key);
  if (cached && cached.expires > Date.now() + 60_000) return cached.url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGN_TTL);
  if (error || !data) return null;
  signedCache.set(key, { url: data.signedUrl, expires: Date.now() + SIGN_TTL * 1000 });
  return data.signedUrl;
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
