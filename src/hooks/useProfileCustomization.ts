import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SocialLinks {
  twitter?: string;
  discord?: string;
  twitch?: string;
  youtube?: string;
  steam?: string;
}

export interface ProfileCustomization {
  id: string;
  user_id: string;
  banner_url: string | null;
  accent_color: string;
  tagline: string | null;
  featured_game_ids: string[];
  social_links: SocialLinks;
  section_order: string[];
  show_activity: boolean;
  show_achievements: boolean;
  show_games: boolean;
}

const DEFAULT_CUSTOMIZATION: Omit<ProfileCustomization, "id" | "user_id"> = {
  banner_url: null,
  accent_color: "#8B5CF6",
  tagline: null,
  featured_game_ids: [],
  social_links: {},
  section_order: ["games", "achievements", "activity"],
  show_activity: true,
  show_achievements: true,
  show_games: true,
};

export const useProfileCustomization = (userId?: string) => {
  return useQuery({
    queryKey: ["profile-customization", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .rpc("get_profile_customization" as any, { p_user_id: userId }) as any;
      
      // Fallback: try direct query if RPC doesn't exist
      if (error) {
        // Table might not exist yet, return defaults
        console.warn("Profile customization not available:", error.message);
        return { ...DEFAULT_CUSTOMIZATION, user_id: userId, id: "" } as ProfileCustomization;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { ...DEFAULT_CUSTOMIZATION, user_id: userId, id: "" } as ProfileCustomization;
      }

      const row = Array.isArray(data) ? data[0] : data;
      return {
        ...row,
        social_links: (row.social_links || {}) as SocialLinks,
        featured_game_ids: row.featured_game_ids || [],
        section_order: row.section_order || ["games", "achievements", "activity"],
      } as ProfileCustomization;
    },
    enabled: !!userId,
  });
};

export const useSaveProfileCustomization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customization: Partial<ProfileCustomization>) => {
      if (!user) throw new Error("Not authenticated");

      // Use raw SQL via RPC or direct fetch
      const { data, error } = await supabase.rpc("upsert_profile_customization" as any, {
        p_user_id: user.id,
        p_banner_url: customization.banner_url || null,
        p_accent_color: customization.accent_color || "#8B5CF6",
        p_tagline: customization.tagline || null,
        p_featured_game_ids: customization.featured_game_ids || [],
        p_social_links: customization.social_links || {},
        p_section_order: customization.section_order || ["games", "achievements", "activity"],
        p_show_activity: customization.show_activity ?? true,
        p_show_achievements: customization.show_achievements ?? true,
        p_show_games: customization.show_games ?? true,
      }) as any;

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-customization"] });
      toast.success("Profile customization saved!");
    },
    onError: (error) => {
      console.error("Error saving customization:", error);
      toast.error("Failed to save customization");
    },
  });
};

export const useUploadBanner = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");

      if (!file.type.startsWith("image/")) throw new Error("Please upload an image file");
      if (file.size > 5 * 1024 * 1024) throw new Error("Banner must be less than 5MB");

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/banner.${fileExt}`;

      await supabase.storage.from("avatars").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return `${publicUrl}?t=${Date.now()}`;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload banner");
    },
  });
};
