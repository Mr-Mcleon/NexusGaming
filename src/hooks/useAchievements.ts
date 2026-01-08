import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUserLibrary } from "./useGames";
import { useFriends } from "./useFriends";
import { useEffect } from "react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_type", { ascending: true })
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });
};

export const useUnlockAchievement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_id: achievementId });

      if (error) {
        if (error.message.includes("duplicate")) {
          return; // Already unlocked, ignore
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
    },
  });
};

export const useAchievementChecker = () => {
  const { user } = useAuth();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  const { data: library } = useUserLibrary();
  const { friends } = useFriends();
  const unlockAchievement = useUnlockAchievement();

  useEffect(() => {
    if (!user || !achievements || !userAchievements || !library) return;

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
    const totalPlaytime = library.reduce((sum, entry) => sum + entry.play_time_minutes, 0);
    const gamesOwned = library.length;
    const friendsCount = friends?.filter((f) => f.status === "accepted").length || 0;

    const checkAndUnlock = async () => {
      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.requirement_type) {
          case "games_owned":
            shouldUnlock = gamesOwned >= achievement.requirement_value;
            break;
          case "total_playtime":
            shouldUnlock = totalPlaytime >= achievement.requirement_value;
            break;
          case "friends_count":
            shouldUnlock = friendsCount >= achievement.requirement_value;
            break;
        }

        if (shouldUnlock) {
          try {
            await unlockAchievement.mutateAsync(achievement.id);
            toast.success(`Achievement Unlocked: ${achievement.name}!`, {
              description: achievement.description,
            });
          } catch {
            // Ignore errors (likely duplicate)
          }
        }
      }
    };

    checkAndUnlock();
  }, [user, achievements, userAchievements, library, friends, unlockAchievement]);
};
