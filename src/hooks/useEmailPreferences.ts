import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useEmailPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: saleEmailEnabled = true, isLoading } = useQuery({
    queryKey: ["email-preferences", user?.id],
    queryFn: async () => {
      if (!user) return true;

      const { data, error } = await supabase
        .from("profiles")
        .select("sale_email_notifications")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.sale_email_notifications ?? true;
    },
    enabled: !!user,
  });

  const updateSaleEmailMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("profiles")
        .update({ sale_email_notifications: enabled })
        .eq("user_id", user.id);

      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
      toast.success(enabled ? "Sale email notifications enabled" : "Sale email notifications disabled");
    },
    onError: () => {
      toast.error("Failed to update email preferences");
    },
  });

  return {
    saleEmailEnabled,
    isLoading,
    setSaleEmailEnabled: updateSaleEmailMutation.mutate,
    isPending: updateSaleEmailMutation.isPending,
  };
};
