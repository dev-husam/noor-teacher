// On-device persistence: IndexedDB as the primary store, with a localStorage mirror as fallback.
// Nothing ever leaves the device — no external database or server.
import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'noor-teacher';
const STORE = 'kv';
/** Prefix of every localStorage / sessionStorage key the app owns. */
const KEY_PREFIX = 'noor';

let dbPromise: Promise<IDBDatabase> | null = null;
/** Set while erasing so no late write recreates the data. */
let wiping = false;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
    }).catch((e) => { dbPromise = null; throw e; });
  }
  return dbPromise;
}

async function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = tx.onabort = () => reject(tx.error || req.error);
  });
}

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* quota or blocked: IndexedDB still has it */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

/** zustand `StateStorage` that keeps the app's data on this device. */
export const deviceStorage: StateStorage = {
  async getItem(name) {
    try {
      const v = await idb<string | undefined>('readonly', (s) => s.get(name));
      if (typeof v === 'string') return v;
    } catch { /* fall back to localStorage */ }
    // First run after upgrading (data only in localStorage), or IndexedDB unavailable.
    const legacy = ls.get(name);
    if (legacy) idb('readwrite', (s) => s.put(legacy, name)).catch(() => {});
    return legacy;
  },
  async setItem(name, value) {
    if (wiping) return;
    ls.set(name, value);
    try { await idb('readwrite', (s) => s.put(value, name)); } catch { /* localStorage mirror still holds it */ }
  },
  async removeItem(name) {
    ls.del(name);
    try { await idb('readwrite', (s) => s.delete(name)); } catch { /* ignore */ }
  },
};

/** Ask the browser not to evict our data under storage pressure. Returns whether storage is persistent. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return false; }
}

export type StorageInfo = { persisted: boolean; usage: number | null; engine: 'IndexedDB' | 'localStorage' };

export async function getStorageInfo(): Promise<StorageInfo> {
  let engine: StorageInfo['engine'] = 'localStorage';
  try { await openDb(); engine = 'IndexedDB'; } catch { /* ignore */ }
  let persisted = false;
  let usage: number | null = null;
  try { persisted = (await navigator.storage?.persisted?.()) ?? false; } catch { /* ignore */ }
  try { usage = (await navigator.storage?.estimate?.())?.usage ?? null; } catch { /* ignore */ }
  return { persisted, usage, engine };
}

/** Permanently erase every piece of app data on this device (IndexedDB + localStorage + sessionStorage). */
export async function wipeDeviceData(): Promise<void> {
  wiping = true;
  try { (await dbPromise)?.close(); } catch { /* ignore */ }
  dbPromise = null;
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    } catch { resolve(); }
  });
  for (const store of [localStorage, sessionStorage]) {
    try {
      Object.keys(store).filter((k) => k.startsWith(KEY_PREFIX)).forEach((k) => store.removeItem(k));
    } catch { /* ignore */ }
  }
}
