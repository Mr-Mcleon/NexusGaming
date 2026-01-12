import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SaleNotification {
  id: string;
  user_id: string;
  game_id: string;
  original_price: number;
  sale_price: number;
  read: boolean;
  created_at: string;
  game?: {
    id: string;
    title: string;
    cover_image_url: string | null;
  };
}

export const useSaleNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sale-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("sale_notifications")
        .select(`
          *,
          game:games (
            id,
            title,
            cover_image_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SaleNotification[];
    },
    enabled: !!user,
  });
};

export const useUnreadSaleNotificationsCount = () => {
  const { data: notifications } = useSaleNotifications();
  return notifications?.filter((n) => !n.read).length ?? 0;
};

export const useMarkSaleNotificationRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("sale_notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-notifications"] });
    },
  });
};

export const useMarkAllSaleNotificationsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("sale_notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-notifications"] });
    },
  });
};

export const useDeleteSaleNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("sale_notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-notifications"] });
    },
  });
};

export const useSaleNotificationSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("sale-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sale_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["sale-notifications"] });
          
          // Show toast for new sale notification
          const notification = payload.new as SaleNotification;
          const discount = Math.round(
            ((notification.original_price - notification.sale_price) / notification.original_price) * 100
          );
          
          toast.success(`🎮 A game on your wishlist is ${discount}% off!`, {
            description: "Check your notifications for details.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};

// Hook to send email notification for a sale
export const useSendSaleEmail = () => {
  return useMutation({
    mutationFn: async (params: {
      user_id: string;
      game_id: string;
      game_title: string;
      original_price: number;
      sale_price: number;
    }) => {
      const response = await supabase.functions.invoke("send-sale-notification-email", {
        body: params,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
  });
};
