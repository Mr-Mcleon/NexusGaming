import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BlockedUser {
  id: string;
  user_id: string;
  blocked_user_id: string;
  created_at: string;
}

export const useBlockedUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as BlockedUser[];
    },
    enabled: !!user,
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("blocked_users")
        .insert({ user_id: user.id, blocked_user_id: blockedUserId });

      if (error) {
        if (error.message.includes("duplicate")) {
          return; // Already blocked
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      toast.success("User blocked");
    },
    onError: () => {
      toast.error("Failed to block user");
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("user_id", user.id)
        .eq("blocked_user_id", blockedUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      toast.success("User unblocked");
    },
    onError: () => {
      toast.error("Failed to unblock user");
    },
  });
};

export const useIsBlocked = () => {
  const { data: blockedUsers } = useBlockedUsers();

  return (userId: string) => {
    return blockedUsers?.some((b) => b.blocked_user_id === userId) ?? false;
  };
};
