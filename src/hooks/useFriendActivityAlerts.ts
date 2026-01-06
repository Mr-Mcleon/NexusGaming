import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "./useFriends";
import { useUserLibrary } from "./useGames";
import { useNotificationAlerts } from "./useNotificationAlerts";

export const useFriendActivityAlerts = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const { data: library = [] } = useUserLibrary();
  const { playSound, showDesktopNotification } = useNotificationAlerts();
  
  // Track previous playing states to detect changes
  const previousStatesRef = useRef<Map<string, string | null>>(new Map());
  const initializedRef = useRef(false);

  // Get list of friend user IDs
  const getFriendIds = useCallback(() => {
    if (!user) return [];
    return friends
      .filter(f => f.status === "accepted")
      .map(f => f.user_id === user.id ? f.friend_id : f.user_id);
  }, [friends, user]);

  // Check if current user owns a game
  const userOwnsGame = useCallback((gameId: string) => {
    return library.some(entry => entry.game_id === gameId);
  }, [library]);

  useEffect(() => {
    if (!user) return;

    const friendIds = getFriendIds();
    if (friendIds.length === 0) return;

    // Fetch initial states (without alerting)
    const fetchInitialStates = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, currently_playing_game_id")
        .in("user_id", friendIds);

      if (data) {
        data.forEach(profile => {
          previousStatesRef.current.set(profile.user_id, profile.currently_playing_game_id);
        });
      }
      initializedRef.current = true;
    };

    fetchInitialStates();

    // Subscribe to profile changes
    const channel = supabase
      .channel("friend-activity-alerts")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        async (payload) => {
          const { user_id, currently_playing_game_id } = payload.new as {
            user_id: string;
            currently_playing_game_id: string | null;
          };

          // Only process friends
          if (!friendIds.includes(user_id)) return;
          
          // Skip if not initialized yet
          if (!initializedRef.current) return;

          const previousGameId = previousStatesRef.current.get(user_id);
          
          // Detect if friend STARTED playing (wasn't playing before, now is)
          if (!previousGameId && currently_playing_game_id) {
            // Check if we own this game
            if (userOwnsGame(currently_playing_game_id)) {
              // Fetch friend's username and game title
              const [profileRes, gameRes] = await Promise.all([
                supabase
                  .from("profiles")
                  .select("username")
                  .eq("user_id", user_id)
                  .maybeSingle(),
                supabase
                  .from("games")
                  .select("title")
                  .eq("id", currently_playing_game_id)
                  .maybeSingle()
              ]);

              const friendName = profileRes.data?.username || "A friend";
              const gameTitle = gameRes.data?.title || "a game";

              playSound();
              showDesktopNotification(`${friendName} is playing ${gameTitle}`, {
                body: "You also own this game!",
                tag: `friend-playing-${user_id}`,
              });
            }
          }

          // Update the previous state
          previousStatesRef.current.set(user_id, currently_playing_game_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, getFriendIds, userOwnsGame, playSound, showDesktopNotification]);
};
