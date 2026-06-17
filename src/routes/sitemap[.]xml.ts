import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://autofie.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/browse/cars", changefreq: "daily", priority: "0.9" },
  { path: "/browse/trucks", changefreq: "daily", priority: "0.8" },
  { path: "/browse/motorcycles", changefreq: "daily", priority: "0.8" },
  { path: "/browse/parts", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/safety-tips", changefreq: "monthly", priority: "0.5" },
  { path: "/auth", changefreq: "monthly", priority: "0.4" },
  { path: "/account-settings", changefreq: "monthly", priority: "0.3" },
  { path: "/complete-dealer-profile", changefreq: "monthly", priority: "0.3" },
  { path: "/messages", changefreq: "weekly", priority: "0.3" },
  { path: "/my-listings", changefreq: "weekly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient(url, key, { auth: { persistSession: false } });
            const { data } = await sb
              .from("listings")
              .select("id, updated_at")
              .eq("status", "approved")
              .order("updated_at", { ascending: false })
              .limit(5000);
            for (const row of data ?? []) {
              entries.push({
                path: `/listing/${(row as any).id}`,
                lastmod: (row as any).updated_at?.slice(0, 10),
                changefreq: "weekly",
                priority: "0.7",
              });
            }
          }
        } catch {
          // fall through with static entries only
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
