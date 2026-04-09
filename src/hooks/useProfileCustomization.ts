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
        .from("profile_customization")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ...DEFAULT_CUSTOMIZATION, user_id: userId, id: "" } as ProfileCustomization;
      return {
        ...data,
        social_links: (data.social_links || {}) as SocialLinks,
        featured_game_ids: data.featured_game_ids || [],
        section_order: data.section_order || ["games", "achievements", "activity"],
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

      const payload = {
        user_id: user.id,
        banner_url: customization.banner_url,
        accent_color: customization.accent_color,
        tagline: customization.tagline,
        featured_game_ids: customization.featured_game_ids,
        social_links: customization.social_links as Record<string, unknown>,
        section_order: customization.section_order,
        show_activity: customization.show_activity,
        show_achievements: customization.show_achievements,
        show_games: customization.show_games,
      };

      const { data, error } = await supabase
        .from("profile_customization")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

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
