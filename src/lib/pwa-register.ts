// Guarded service-worker registration. Only registers in production on the
// real published origin. In dev/preview/iframes it unregisters any stale SW.

const APP_SW_PATHS = ["/sw.js"];

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterAppSWs() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return APP_SW_PATHS.some((p) => url.endsWith(p));
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
}

export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  if (isRefusedContext()) {
    void unregisterAppSWs();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* swallow — offline is best-effort */
    });
  });
}
