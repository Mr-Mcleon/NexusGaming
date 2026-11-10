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

      const { data, error } = await supabase.rpc("get_friend_leaderboard");
      if (error) throw error;
      return (data ?? []).map((entry): LeaderboardEntry => ({
        userId: entry.user_id,
        username: entry.username || "Unknown",
        avatarUrl: entry.avatar_url ?? null,
        totalPlaytime: Number(entry.total_playtime),
        achievementCount: Number(entry.achievement_count),
        gamesOwned: Number(entry.games_owned),
      }));
    },
    enabled: !!user,
  });
};
