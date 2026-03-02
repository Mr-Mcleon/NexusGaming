import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLibrary, type Game } from "./useGames";

export interface RecommendedGame extends Game {
  matchScore: number;
  matchReasons: string[];
}

export const useRecommendations = (limit = 8) => {
  const { user } = useAuth();
  const { data: library } = useUserLibrary();

  return useQuery({
    queryKey: ["recommendations", user?.id, library?.length],
    queryFn: async (): Promise<RecommendedGame[]> => {
      if (!user || !library || library.length === 0) return [];

      // Analyze user's genre preferences weighted by playtime
      const genreScores = new Map<string, number>();
      let totalPlaytime = 0;

      for (const entry of library) {
        const genres = entry.game.genres || [];
        const weight = Math.max(entry.play_time_minutes, 1); // min weight of 1
        totalPlaytime += weight;

        for (const genre of genres) {
          genreScores.set(genre, (genreScores.get(genre) || 0) + weight);
        }
      }

      // Normalize genre scores
      if (totalPlaytime > 0) {
        for (const [genre, score] of genreScores) {
          genreScores.set(genre, score / totalPlaytime);
        }
      }

      // Get the user's owned game IDs
      const ownedGameIds = new Set(library.map((e) => e.game_id));

      // Fetch all games not in the user's library
      const { data: allGames, error } = await supabase
        .from("games")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      if (!allGames) return [];

      // Score each game
      const scored: RecommendedGame[] = allGames
        .filter((g) => !ownedGameIds.has(g.id))
        .map((game) => {
          let matchScore = 0;
          const matchReasons: string[] = [];
          const gameGenres = game.genres || [];

          // Genre match scoring (weighted by user preference)
          for (const genre of gameGenres) {
            const genreWeight = genreScores.get(genre) || 0;
            if (genreWeight > 0) {
              matchScore += genreWeight * 50;
              matchReasons.push(genre);
            }
          }

          // Boost highly rated games
          if (game.rating && game.rating >= 4.5) {
            matchScore += 15;
          } else if (game.rating && game.rating >= 4.0) {
            matchScore += 8;
          }

          // Boost games on sale
          if (game.sale_price && game.price && game.sale_price < game.price) {
            matchScore += 10;
            matchReasons.push("On Sale");
          }

          // Deduplicate reasons
          const uniqueReasons = [...new Set(matchReasons)];

          return {
            ...game,
            matchScore,
            matchReasons: uniqueReasons.slice(0, 3),
          } as RecommendedGame;
        })
        .filter((g) => g.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      return scored;
    },
    enabled: !!user && !!library && library.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
