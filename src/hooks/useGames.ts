import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Game {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  developer: string | null;
  publisher: string | null;
  release_date: string | null;
  genres: string[] | null;
  tags: string[] | null;
  price: number | null;
  sale_price: number | null;
  rating: number | null;
  created_at: string;
}

export interface LibraryEntry {
  id: string;
  user_id: string;
  game_id: string;
  is_favorite: boolean;
  play_time_minutes: number;
  last_played_at: string | null;
  installed: boolean;
  added_at: string;
  game: Game;
}

export const useGames = () => {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("title");
      
      if (error) throw error;
      return data as Game[];
    },
  });
};

export const useUserLibrary = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-library", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_library")
        .select(`
          *,
          game:games(*)
        `)
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });
      
      if (error) throw error;
      return data as LibraryEntry[];
    },
    enabled: !!user,
  });
};

export const useAddToLibrary = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("user_library")
        .insert({ user_id: user.id, game_id: gameId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
      toast.success("Game added to library!");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Game is already in your library");
      } else {
        toast.error("Failed to add game");
      }
    },
  });
};

export const useRemoveFromLibrary = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("user_library")
        .delete()
        .eq("user_id", user.id)
        .eq("game_id", gameId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
      toast.success("Game removed from library");
    },
    onError: () => {
      toast.error("Failed to remove game");
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ gameId, isFavorite }: { gameId: string; isFavorite: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("user_library")
        .update({ is_favorite: isFavorite })
        .eq("user_id", user.id)
        .eq("game_id", gameId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
      toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
    },
    onError: () => {
      toast.error("Failed to update favorite");
    },
  });
};

export const useUpdatePlayTime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ gameId, minutes }: { gameId: string; minutes: number }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("user_library")
        .update({ 
          play_time_minutes: minutes,
          last_played_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("game_id", gameId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
    },
  });
};
