import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "./useFriends";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPlaytime: number;
  achievementCount: number;
  gamesOwned: number;
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const { friends } = useFriends();

  return useQuery({
    queryKey: ["leaderboard", user?.id, friends.length],
    queryFn: async () => {
      if (!user) return [];

      // Get friend user IDs + current user
      const friendUserIds = friends
        .filter((f) => f.status === "accepted")
        .map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
      
      const allUserIds = [user.id, ...friendUserIds];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", allUserIds);

      // Fetch library stats (playtime + games owned)
      const { data: libraryStats } = await supabase
        .from("user_library")
        .select("user_id, play_time_minutes")
        .in("user_id", allUserIds);

      // Fetch achievement counts
      const { data: achievementStats } = await supabase
        .from("user_achievements")
        .select("user_id")
        .in("user_id", allUserIds);

      // Aggregate stats per user
      const statsMap = new Map<string, { playtime: number; games: number; achievements: number }>();
      
      allUserIds.forEach((id) => {
        statsMap.set(id, { playtime: 0, games: 0, achievements: 0 });
      });

      libraryStats?.forEach((entry) => {
        const stats = statsMap.get(entry.user_id);
        if (stats) {
          stats.playtime += entry.play_time_minutes;
          stats.games += 1;
        }
      });

      achievementStats?.forEach((entry) => {
        const stats = statsMap.get(entry.user_id);
        if (stats) {
          stats.achievements += 1;
        }
      });

      // Build leaderboard entries
      const entries: LeaderboardEntry[] = allUserIds.map((userId) => {
        const profile = profiles?.find((p) => p.user_id === userId);
        const stats = statsMap.get(userId) || { playtime: 0, games: 0, achievements: 0 };

        return {
          userId,
          username: profile?.username || "Unknown",
          avatarUrl: profile?.avatar_url,
          totalPlaytime: stats.playtime,
          achievementCount: stats.achievements,
          gamesOwned: stats.games,
        };
      });

      return entries;
    },
    enabled: !!user,
  });
};
