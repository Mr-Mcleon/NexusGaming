import { supabase } from "@/integrations/supabase/client";

interface CacheEntry {
  ids: string[];
  expiresAt: number;
  inflight?: Promise<string[]>;
}

const TTL_MS = 30_000; // 30s — long enough to cover typing + a few re-renders
const MAX_ENTRIES = 50;
const cache = new Map<string, CacheEntry>();

// --- Metrics ---
export interface CacheMetrics {
  hits: number;
  misses: number;
  lookups: number;
  hitRate: number; // 0..1
  lastPrewarmDurationMs: number | null;
  lastPrewarmAt: number | null;
  prewarmCount: number;
  primedEntries: number;
  cacheSize: number;
}

const metrics = {
  hits: 0,
  misses: 0,
  lastPrewarmDurationMs: null as number | null,
  prewarmCount: 0,
  primedEntries: 0,
};

type Listener = (m: CacheMetrics) => void;
const listeners = new Set<Listener>();

export function getCacheMetrics(): CacheMetrics {
  const lookups = metrics.hits + metrics.misses;
  return {
    hits: metrics.hits,
    misses: metrics.misses,
    lookups,
    hitRate: lookups > 0 ? metrics.hits / lookups : 0,
    lastPrewarmDurationMs: metrics.lastPrewarmDurationMs,
    lastPrewarmAt: lastPrewarmAt || null,
    prewarmCount: metrics.prewarmCount,
    primedEntries: metrics.primedEntries,
    cacheSize: cache.size,
  };
}

export function subscribeCacheMetrics(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const emit = () => {
  const snapshot = getCacheMetrics();
  listeners.forEach((l) => l(snapshot));
};


const norm = (q: string) => q.trim().toLowerCase();

const evictIfNeeded = () => {
  if (cache.size <= MAX_ENTRIES) return;
  // Remove oldest (insertion order)
  const oldest = cache.keys().next().value;
  if (oldest !== undefined) cache.delete(oldest);
};

export async function searchUserIdsCached(query: string): Promise<string[]> {
  const key = norm(query);
  if (!key) return [];

  const now = Date.now();
  const hit = cache.get(key);
  if (hit) {
    if (hit.inflight) {
      metrics.hits++;
      emit();
      return hit.inflight;
    }
    if (hit.expiresAt > now) {
      metrics.hits++;
      emit();
      return hit.ids;
    }
  }
  metrics.misses++;
  emit();

  const inflight = (async () => {
    const { data, error } = await supabase.rpc("search_profile_user_ids", {
      _query: query,
      _limit: 200,
    });
    if (error) {
      cache.delete(key);
      return [];
    }
    const ids = (data ?? []).map((p: any) => p.user_id as string);
    cache.set(key, { ids, expiresAt: Date.now() + TTL_MS });
    evictIfNeeded();
    emit();
    return ids;
  })();

  cache.set(key, { ids: hit?.ids ?? [], expiresAt: 0, inflight });
  try {
    return await inflight;
  } finally {
    const entry = cache.get(key);
    if (entry) delete entry.inflight;
  }
}

export function clearUsernameSearchCache() {
  cache.clear();
}

/**
 * Seed cache with a known username → user_id mapping without an RPC roundtrip.
 * Used for prewarming common queries (e.g. admin usernames).
 */
export function primeUsernameCache(username: string, userIds: string[]) {
  const key = norm(username);
  if (!key) return;
  cache.set(key, { ids: userIds, expiresAt: Date.now() + TTL_MS });
  evictIfNeeded();
}

let prewarmInflight: Promise<void> | null = null;
let lastPrewarmAt = 0;
const PREWARM_COOLDOWN_MS = 60_000;

/**
 * Prewarm the search cache with admin usernames. Idempotent + cooldowned.
 * Admins (per RLS) can read user_roles; non-admins simply get an empty list.
 */
export async function prewarmAdminUsernames(): Promise<void> {
  if (prewarmInflight) return prewarmInflight;
  if (Date.now() - lastPrewarmAt < PREWARM_COOLDOWN_MS) return;

  prewarmInflight = (async () => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id as string)));
      if (ids.length === 0) return;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", ids);

      (profiles ?? []).forEach((p: any) => {
        if (p.username) primeUsernameCache(p.username, [p.user_id]);
      });
      lastPrewarmAt = Date.now();
    } finally {
      prewarmInflight = null;
    }
  })();
  return prewarmInflight;
}
