import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WishlistShare {
  id: string;
  user_id: string;
  share_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SharedWishlistItem {
  id: string;
  added_at: string;
  game_id: string;
  game_title: string;
  game_description: string | null;
  game_cover_image_url: string | null;
  game_price: number | null;
  game_sale_price: number | null;
  game_rating: number | null;
  game_genres: string[] | null;
  owner_username: string;
}

export const useWishlistShare = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist-share", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("wishlist_shares")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as WishlistShare | null;
    },
    enabled: !!user,
  });
};

export const useCreateWishlistShare = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("wishlist_shares")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Duplicate - fetch existing
          const { data: existing } = await supabase
            .from("wishlist_shares")
            .select("*")
            .eq("user_id", user.id)
            .single();
          return existing as WishlistShare;
        }
        throw error;
      }
      return data as WishlistShare;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-share"] });
    },
  });
};

export const useToggleWishlistShare = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("wishlist_shares")
        .update({ is_active: isActive })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-share"] });
      toast.success(isActive ? "Wishlist sharing enabled" : "Wishlist sharing disabled");
    },
    onError: () => {
      toast.error("Failed to update sharing settings");
    },
  });
};

export const useRegenerateShareToken = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      // Delete existing and create new
      await supabase
        .from("wishlist_shares")
        .delete()
        .eq("user_id", user.id);

      const { data, error } = await supabase
        .from("wishlist_shares")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as WishlistShare;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-share"] });
      toast.success("New share link generated");
    },
    onError: () => {
      toast.error("Failed to generate new link");
    },
  });
};

export const useSharedWishlist = (token: string | null) => {
  return useQuery({
    queryKey: ["shared-wishlist", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .rpc("get_shared_wishlist", { p_token: token });

      if (error) throw error;
      return data as SharedWishlistItem[];
    },
    enabled: !!token,
  });
};
