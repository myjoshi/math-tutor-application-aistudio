/**
 * IndexedDB-backed offline cache for the student's profile, scans, and quiz
 * results.
 *
 * Replaces the previous localStorage cache: scanned homework is stored with a
 * base64 `imageUrl`, so a handful of scans blows past the ~5MB localStorage
 * quota (and `setItem` then throws mid-render). IndexedDB stores structured
 * clones with a much larger quota and no JSON round-trip.
 *
 * Firestore remains the source of truth for cloud sync; this is purely the
 * local/offline layer.
 */

import { StudentProfile, ScannedPaperResult, AssessmentResult } from "../types";

const DB_NAME = "math_tutor_local";
const DB_VERSION = 1;
const STORE_NAME = "app_state";

const KEY_PROFILE = "profile";
const KEY_SCANS = "scans";
const KEY_QUIZZES = "quizzes";

// Keys written by the old localStorage cache, migrated on first load.
const LEGACY_KEYS: { [key: string]: string } = {
  [KEY_PROFILE]: "math_tutor_profile",
  [KEY_SCANS]: "math_tutor_scans",
  [KEY_QUIZZES]: "math_tutor_quizzes"
};

export interface LocalState {
  profile: StudentProfile | null;
  scans: ScannedPaperResult[];
  quizResults: AssessmentResult[];
}

let dbPromise: Promise<IDBDatabase> | null = null;

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch (e) {
    // Accessing indexedDB can throw outright when site data is blocked.
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgrading the schema would block us otherwise.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB upgrade blocked by another tab"));
  }).catch((error) => {
    // Let a later call retry instead of caching the rejection forever.
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error);
      })
  );
}

function idbPut(key: string, value: unknown): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

function idbClear(): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

/* ==========================================
   localStorage fallback
   Used when IndexedDB is unavailable (private windows, blocked site data).
   ========================================== */

function fallbackGet<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(LEGACY_KEYS[key]);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch (e) {
    console.warn(`Local cache read failed for "${key}": `, e);
    return undefined;
  }
}

function fallbackPut(key: string, value: unknown): void {
  try {
    localStorage.setItem(LEGACY_KEYS[key], JSON.stringify(value));
  } catch (e) {
    // Quota exceeded is expected here for image-heavy scans — the cloud copy
    // still holds the data, so degrade quietly rather than break the render.
    console.warn(`Local cache write failed for "${key}": `, e);
  }
}

function removeLegacyKey(key: string): void {
  try {
    localStorage.removeItem(LEGACY_KEYS[key]);
  } catch (e) {
    /* nothing we can do, and nothing depends on it */
  }
}

/**
 * Reads a key from IndexedDB, falling back to (and one-time migrating from)
 * the old localStorage cache.
 */
async function readKey<T>(key: string): Promise<T | undefined> {
  if (!hasIndexedDB()) return fallbackGet<T>(key);

  const stored = await idbGet<T>(key);
  if (stored !== undefined) {
    // IndexedDB already owns this key; drop any stale localStorage copy.
    removeLegacyKey(key);
    return stored;
  }

  const legacy = fallbackGet<T>(key);
  if (legacy !== undefined) {
    await idbPut(key, legacy);
    removeLegacyKey(key);
  }
  return legacy;
}

async function writeKey(key: string, value: unknown): Promise<void> {
  if (!hasIndexedDB()) {
    fallbackPut(key, value);
    return;
  }
  try {
    await idbPut(key, value);
  } catch (e) {
    console.warn(`IndexedDB write failed for "${key}", falling back to localStorage: `, e);
    fallbackPut(key, value);
  }
}

/** Loads the whole offline cache. Never throws — a cold cache is a valid state. */
export async function loadLocalState(): Promise<LocalState> {
  const [profile, scans, quizResults] = await Promise.all([
    readKey<StudentProfile>(KEY_PROFILE).catch(() => undefined),
    readKey<ScannedPaperResult[]>(KEY_SCANS).catch(() => undefined),
    readKey<AssessmentResult[]>(KEY_QUIZZES).catch(() => undefined)
  ]);

  return {
    profile: profile ?? null,
    scans: Array.isArray(scans) ? scans : [],
    quizResults: Array.isArray(quizResults) ? quizResults : []
  };
}

export function saveLocalProfile(profile: StudentProfile): Promise<void> {
  return writeKey(KEY_PROFILE, profile);
}

export function saveLocalScans(scans: ScannedPaperResult[]): Promise<void> {
  return writeKey(KEY_SCANS, scans);
}

export function saveLocalQuizResults(quizResults: AssessmentResult[]): Promise<void> {
  return writeKey(KEY_QUIZZES, quizResults);
}

/** Wipes the offline cache (both IndexedDB and any legacy localStorage keys). */
export async function clearLocalState(): Promise<void> {
  Object.keys(LEGACY_KEYS).forEach(removeLegacyKey);
  if (!hasIndexedDB()) return;
  try {
    await idbClear();
  } catch (e) {
    console.warn("Failed to clear IndexedDB cache: ", e);
  }
}
