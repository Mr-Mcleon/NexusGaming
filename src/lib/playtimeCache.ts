// Lightweight IndexedDB cache for aggregated external playtime totals.
// Stores one snapshot per user keyed by user id.

const DB_NAME = "library-playtime-cache";
const STORE = "snapshots";
const DB_VERSION = 1;

export interface PlaytimePlatformEntry {
  platform: string;
  minutes: number;
  count: number;
}

export interface PlaytimeSnapshotEntry {
  key: string;
  title: string;
  totalPlaytime: number;
  byPlatform: PlaytimePlatformEntry[];
  entryCount: number;
}

export interface PlaytimeSnapshot {
  userId: string;
  cachedAt: number;
  totalMinutes: number;
  entries: PlaytimeSnapshotEntry[];
}

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "userId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });

export const loadPlaytimeSnapshot = async (
  userId: string,
): Promise<PlaytimeSnapshot | null> => {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(userId);
      req.onsuccess = () => resolve((req.result as PlaytimeSnapshot) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

export const savePlaytimeSnapshot = async (
  snapshot: PlaytimeSnapshot,
): Promise<void> => {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(snapshot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache write failures are non-fatal.
  }
};

export const clearPlaytimeSnapshot = async (userId: string): Promise<void> => {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(userId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
};
