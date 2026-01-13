import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PriceAlert {
  id: string;
  user_id: string;
  game_id: string;
  target_price: number;
  notified: boolean;
  created_at: string;
}

export const usePriceAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["price-alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("wishlist_price_alerts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as PriceAlert[];
    },
    enabled: !!user,
  });
};

export const useSetPriceAlert = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ gameId, targetPrice }: { gameId: string; targetPrice: number }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("wishlist_price_alerts")
        .upsert(
          { 
            user_id: user.id, 
            game_id: gameId, 
            target_price: targetPrice,
            notified: false 
          },
          { onConflict: "user_id,game_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast.success("Price alert set!");
    },
    onError: () => {
      toast.error("Failed to set price alert");
    },
  });
};

export const useRemovePriceAlert = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("wishlist_price_alerts")
        .delete()
        .eq("user_id", user.id)
        .eq("game_id", gameId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast.success("Price alert removed");
    },
    onError: () => {
      toast.error("Failed to remove price alert");
    },
  });
};

export const useGetPriceAlert = (gameId: string) => {
  const { data: alerts } = usePriceAlerts();
  return alerts?.find((alert) => alert.game_id === gameId);
};
