import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Game } from "./useGames";

export interface GameScreenshot {
  id: string;
  game_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface GameReview {
  id: string;
  game_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export const useGameDetails = (gameId: string) => {
  return useQuery({
    queryKey: ["game-details", gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();

      if (error) throw error;
      return data as Game | null;
    },
    enabled: !!gameId,
  });
};

export const useGameScreenshots = (gameId: string) => {
  return useQuery({
    queryKey: ["game-screenshots", gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_screenshots")
        .select("*")
        .eq("game_id", gameId)
        .order("display_order");

      if (error) throw error;
      return data as GameScreenshot[];
    },
    enabled: !!gameId,
  });
};

export const useGameReviews = (gameId: string) => {
  return useQuery({
    queryKey: ["game-reviews", gameId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_reviews")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for reviewers
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);

        return data.map((review) => ({
          ...review,
          profile: profiles?.find((p) => p.user_id === review.user_id),
        })) as GameReview[];
      }

      return data as GameReview[];
    },
    enabled: !!gameId,
  });
};

export const useUserPlayHistory = (gameId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-play-history", gameId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_library")
        .select("*")
        .eq("user_id", user.id)
        .eq("game_id", gameId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!gameId && !!user,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      gameId,
      rating,
      title,
      content,
    }: {
      gameId: string;
      rating: number;
      title?: string;
      content?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("game_reviews").upsert(
        {
          game_id: gameId,
          user_id: user.id,
          rating,
          title: title || null,
          content: content || null,
        },
        { onConflict: "game_id,user_id" }
      );

      if (error) throw error;
    },
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ["game-reviews", gameId] });
      queryClient.invalidateQueries({ queryKey: ["user-review-count", user?.id] });
      toast.success("Review submitted!");
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("game_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-review-count", user?.id] });
      toast.success("Review deleted");
    },
    onError: () => {
      toast.error("Failed to delete review");
    },
  });
};
