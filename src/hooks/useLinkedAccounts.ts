import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Platform = "steam" | "xbox" | "playstation" | "google_play" | "other";

export const PLATFORM_LABELS: Record<Platform, string> = {
  steam: "Steam",
  xbox: "Xbox",
  playstation: "PlayStation",
  google_play: "Google Play",
  other: "Other",
};

export interface LinkedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string | null;
  display_name: string | null;
  metadata: Record<string, unknown>;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalGame {
  id: string;
  user_id: string;
  linked_account_id: string | null;
  platform: Platform;
  external_id: string | null;
  title: string;
  cover_image_url: string | null;
  playtime_minutes: number;
  installed: boolean;
  last_played_at: string | null;
  imported_at: string;
  metadata: Record<string, unknown>;
}

export const useLinkedAccounts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["linked-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("linked_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LinkedAccount[];
    },
    enabled: !!user,
  });
};

export const useLinkAccount = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      platform: Platform;
      platform_user_id?: string;
      display_name?: string;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("linked_accounts").upsert(
        {
          user_id: user.id,
          platform: input.platform,
          platform_user_id: input.platform_user_id || null,
          display_name: input.display_name || null,
        },
        { onConflict: "user_id,platform" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["linked-accounts"] });
      toast.success("Account linked");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to link account"),
  });
};

export const useUnlinkAccount = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("linked_accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["linked-accounts"] });
      qc.invalidateQueries({ queryKey: ["external-games"] });
      toast.success("Account unlinked");
    },
  });
};

export const useExternalGames = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["external-games", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("external_games")
        .select("*")
        .eq("user_id", user.id)
        .order("imported_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExternalGame[];
    },
    enabled: !!user,
  });
};

export interface ImportableGame {
  title: string;
  external_id?: string;
  cover_image_url?: string;
  playtime_minutes?: number;
  installed?: boolean;
  last_played_at?: string;
}

export const useImportExternalGames = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      platform: Platform;
      linked_account_id?: string | null;
      games: ImportableGame[];
    }) => {
      if (!user) throw new Error("Not signed in");
      if (!input.games.length) return 0;
      const rows = input.games
        .filter((g) => g.title?.trim())
        .map((g) => ({
          user_id: user.id,
          linked_account_id: input.linked_account_id ?? null,
          platform: input.platform,
          external_id: g.external_id ?? g.title.toLowerCase().replace(/\s+/g, "-"),
          title: g.title.trim(),
          cover_image_url: g.cover_image_url ?? null,
          playtime_minutes: g.playtime_minutes ?? 0,
          installed: g.installed ?? false,
          last_played_at: g.last_played_at ?? null,
        }));
      const { error } = await supabase
        .from("external_games")
        .upsert(rows, { onConflict: "user_id,platform,external_id" });
      if (error) throw error;
      if (input.linked_account_id) {
        await supabase
          .from("linked_accounts")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", input.linked_account_id);
      }
      return rows.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["external-games"] });
      qc.invalidateQueries({ queryKey: ["linked-accounts"] });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("external-games:imported", { detail: { count } }),
        );
      }
      if (typeof count === "number") toast.success(`Imported ${count} game${count === 1 ? "" : "s"}`);
    },
    onError: (e: Error) => toast.error(e.message || "Import failed"),
  });
};

export const useDeleteExternalGame = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("external_games")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external-games"] }),
  });
};
