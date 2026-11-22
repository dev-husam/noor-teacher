import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './lib/pwa';
import { requestPersistentStorage } from './lib/storage';
import { useStore } from './store';
import './styles.css';

let started = false;
const start = () => {
  if (started) return;
  started = true;
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  // Ask the browser to keep this device's data (no eviction under storage pressure).
  if (useStore.getState().settings.onboarded) requestPersistentStorage();
  else {
    const unsub = useStore.subscribe((s) => { if (s.settings.onboarded) { unsub(); requestPersistentStorage(); } });
  }
};

registerServiceWorker();

// Saved data loads asynchronously from IndexedDB: render once it is in, so the
// teacher continues exactly where they left off (with a safety timeout).
if (useStore.persist.hasHydrated()) start();
else {
  useStore.persist.onFinishHydration(start);
  setTimeout(start, 3000);
}
