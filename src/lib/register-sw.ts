// Guarded service-worker registration.
// Never registers in dev, in an iframe, or in Lovable preview hosts —
// a stale SW there would serve deleted chunks and break the editor preview.
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const h = window.location.hostname;
  const isPreviewHost =
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" ||
    h.endsWith(".beta.lovable.dev");

  const inIframe = window.self !== window.top;
  const killSwitch = new URL(window.location.href).searchParams.get("sw") === "off";

  if (!import.meta.env.PROD || isPreviewHost || inIframe || killSwitch) {
    navigator.serviceWorker
      .getRegistrations?.()
      .then((regs) => {
        regs.forEach((r) => {
          if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
        });
      })
      .catch(() => {});
    return;
  }

  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
