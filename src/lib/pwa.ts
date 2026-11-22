// Service worker registration that keeps installed copies up to date:
// checks for a new deploy on launch, when the app comes back to the foreground and hourly,
// and reloads once the new version has taken over (data lives in IndexedDB, so nothing is lost).
import { IS_ARTIFACT } from './platform';

export function registerServiceWorker() {
  if (IS_ARTIFACT || import.meta.env.DEV || !('serviceWorker' in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First install has no previous controller: nothing to refresh.
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      const check = () => reg.update().catch(() => { /* offline: try again later */ });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
      setInterval(check, 60 * 60 * 1000);
    } catch { /* service worker unavailable: the app still works online */ }
  });
}
