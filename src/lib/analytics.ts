type GtagWindow = Window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  const w = window as GtagWindow;
  if (typeof w.gtag === "function") {
    w.gtag("event", name, params);
  } else {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: name, ...params });
  }
}
