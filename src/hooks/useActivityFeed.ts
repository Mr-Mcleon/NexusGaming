import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

export type ActivityType = 
  | "game_started" 
  | "game_stopped" 
  | "game_purchased" 
  | "achievement_unlocked" 
  | "friend_added";

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  game_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  game?: {
    title: string;
    cover_image_url: string | null;
  };
}

export const useActivityFeed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["activity-feed", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch profiles and games
      const userIds = [...new Set(data.map((a) => a.user_id))];
      const gameIds = [...new Set(data.filter((a) => a.game_id).map((a) => a.game_id!))] ;

      const [profilesRes, gamesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds),
        gameIds.length > 0
          ? supabase
              .from("games")
              .select("id, title, cover_image_url")
              .in("id", gameIds)
          : Promise.resolve({ data: [] }),
      ]);

      return data.map((activity) => ({
        ...activity,
        activity_type: activity.activity_type as ActivityType,
        metadata: (activity.metadata || {}) as Record<string, unknown>,
        profile: profilesRes.data?.find((p) => p.user_id === activity.user_id),
        game: gamesRes.data?.find((g) => g.id === activity.game_id),
      })) as Activity[];
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("activity-feed-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_feed",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
};

export const useLogActivity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
      gameId,
      metadata,
    }: {
      activityType: ActivityType;
      gameId?: string;
      metadata?: Json;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("activity_feed").insert([{
        user_id: user.id,
        activity_type: activityType,
        game_id: gameId || null,
        metadata: metadata || {},
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
    },
  });
};
