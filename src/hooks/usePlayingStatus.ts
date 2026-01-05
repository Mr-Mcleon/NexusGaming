import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlayingStatus {
  userId: string;
  gameId: string | null;
  gameTitle: string | null;
}

export const usePlayingStatus = (userIds: string[]) => {
  const [playingStatuses, setPlayingStatuses] = useState<Map<string, PlayingStatus>>(new Map());

  const fetchStatuses = useCallback(async () => {
    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select(`
        user_id,
        currently_playing_game_id,
        games:currently_playing_game_id (
          id,
          title
        )
      `)
      .in("user_id", userIds)
      .not("currently_playing_game_id", "is", null);

    if (data) {
      const statusMap = new Map<string, PlayingStatus>();
      data.forEach((profile) => {
        const game = profile.games as { id: string; title: string } | null;
        statusMap.set(profile.user_id, {
          userId: profile.user_id,
          gameId: profile.currently_playing_game_id,
          gameTitle: game?.title || null,
        });
      });
      setPlayingStatuses(statusMap);
    }
  }, [userIds]);

  useEffect(() => {
    fetchStatuses();

    // Subscribe to realtime changes on profiles
    const channel = supabase
      .channel("playing-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (userIds.includes(payload.new.user_id)) {
            fetchStatuses();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIds, fetchStatuses]);

  const getPlayingGame = useCallback(
    (userId: string): string | null => {
      return playingStatuses.get(userId)?.gameTitle || null;
    },
    [playingStatuses]
  );

  return { playingStatuses, getPlayingGame, refresh: fetchStatuses };
};

export const useSetPlayingStatus = () => {
  const { user } = useAuth();

  const setPlaying = async (gameId: string | null) => {
    if (!user) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ currently_playing_game_id: gameId })
      .eq("user_id", user.id);

    return !error;
  };

  const stopPlaying = () => setPlaying(null);

  return { setPlaying, stopPlaying };
};
