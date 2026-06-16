import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  loadPlaytimeSnapshot,
  savePlaytimeSnapshot,
  type PlaytimeSnapshot,
  type PlaytimeSnapshotEntry,
} from "@/lib/playtimeCache";

export interface MergedLike {
  key: string;
  title: string;
  totalPlaytime: number;
  byPlatform: { platform: string; minutes: number; count: number }[];
  entries: { id: string }[];
}

const toSnapshotEntries = (merged: MergedLike[]): PlaytimeSnapshotEntry[] =>
  merged.map((m) => ({
    key: m.key,
    title: m.title,
    totalPlaytime: m.totalPlaytime,
    byPlatform: m.byPlatform.map((p) => ({
      platform: p.platform,
      minutes: p.minutes,
      count: p.count,
    })),
    entryCount: m.entries.length,
  }));

export const useMergedPlaytimeCache = (merged: MergedLike[]) => {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<PlaytimeSnapshot | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAutoRefresh, setPendingAutoRefresh] = useState(false);

  // Hydrate cached snapshot once on mount / user change.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSnapshot(null);
      setIsHydrated(true);
      return;
    }
    setIsHydrated(false);
    loadPlaytimeSnapshot(user.id).then((snap) => {
      if (cancelled) return;
      setSnapshot(snap);
      setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persist = useCallback(
    async (entries: MergedLike[]) => {
      if (!user) return null;
      const snap: PlaytimeSnapshot = {
        userId: user.id,
        cachedAt: Date.now(),
        totalMinutes: entries.reduce((s, m) => s + m.totalPlaytime, 0),
        entries: toSnapshotEntries(entries),
      };
      await savePlaytimeSnapshot(snap);
      setSnapshot(snap);
      return snap;
    },
    [user?.id],
  );

  // Listen for completed imports/re-scans and queue an auto-refresh that fires
  // once the freshly fetched merged data has propagated to this hook.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setPendingAutoRefresh(true);
    window.addEventListener("external-games:imported", handler);
    return () => window.removeEventListener("external-games:imported", handler);
  }, []);

  // Auto-persist when stale, or when a re-scan just completed.
  useEffect(() => {
    if (!user || !isHydrated) return;
    const liveTotal = merged.reduce((s, m) => s + m.totalPlaytime, 0);
    const stale =
      !snapshot ||
      snapshot.entries.length !== merged.length ||
      snapshot.totalMinutes !== liveTotal;
    if (stale || pendingAutoRefresh) {
      void persist(merged).then(() => {
        if (pendingAutoRefresh) setPendingAutoRefresh(false);
      });
    }
  }, [merged, isHydrated, user?.id, pendingAutoRefresh]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      return await persist(merged);
    } finally {
      setIsRefreshing(false);
    }
  }, [persist, merged]);

  return {
    snapshot,
    cachedAt: snapshot?.cachedAt ?? null,
    isHydrated,
    isRefreshing,
    refresh,
  };
};
