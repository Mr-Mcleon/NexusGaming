import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Activity, ActivityType } from "./useActivityFeed";
import type { Achievement, UserAchievement } from "./useAchievements";

export interface PublicProfile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export const usePublicProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, bio, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: !!userId,
  });
};

export const usePublicLibrary = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-library", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_library")
        .select(`
          id, game_id, play_time_minutes, is_favorite, last_played_at, added_at,
          game:games(id, title, cover_image_url, genres)
        `)
        .eq("user_id", userId)
        .order("last_played_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const usePublicAchievements = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-achievements", userId],
    queryFn: async () => {
      if (!userId) return { achievements: [] as Achievement[], userAchievements: [] as UserAchievement[] };
      const [achRes, uaRes] = await Promise.all([
        supabase.from("achievements").select("*").order("requirement_type").order("requirement_value"),
        supabase.from("user_achievements").select("*, achievement:achievements(*)").eq("user_id", userId).order("unlocked_at", { ascending: false }),
      ]);
      if (achRes.error) throw achRes.error;
      if (uaRes.error) throw uaRes.error;
      return {
        achievements: (achRes.data || []) as Achievement[],
        userAchievements: (uaRes.data || []) as UserAchievement[],
      };
    },
    enabled: !!userId,
  });
};

export const usePublicActivity = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-activity", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const gameIds = [...new Set(data.filter((a) => a.game_id).map((a) => a.game_id!))];
      const gamesRes = gameIds.length > 0
        ? await supabase.from("games").select("id, title, cover_image_url").in("id", gameIds)
        : { data: [] };

      return data.map((activity) => ({
        ...activity,
        activity_type: activity.activity_type as ActivityType,
        metadata: (activity.metadata || {}) as Record<string, unknown>,
        game: gamesRes.data?.find((g) => g.id === activity.game_id),
      })) as Activity[];
    },
    enabled: !!userId,
  });
};
