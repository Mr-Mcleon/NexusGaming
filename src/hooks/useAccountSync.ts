import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

interface SyncedSettings {
  theme: Theme;
  sound_enabled: boolean;
  desktop_notifications_enabled: boolean;
  last_synced_at: string | null;
}

const LOCAL_NOTIFICATION_KEY = "notification_settings";
const LOCAL_SYNC_ENABLED_KEY = "account_sync_enabled";

export const useAccountSync = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  
  const [syncEnabled, setSyncEnabledState] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SYNC_ENABLED_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  // Fetch cloud settings
  const { data: cloudSettings, isLoading, refetch } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as SyncedSettings | null;
    },
    enabled: !!user && syncEnabled,
  });

  // Sync settings to cloud
  const syncToCloudMutation = useMutation({
    mutationFn: async (settings: Partial<SyncedSettings>) => {
      if (!user) throw new Error("Must be logged in");

      // Get local notification settings
      let localNotifications = { soundEnabled: true, desktopEnabled: true };
      try {
        const stored = localStorage.getItem(LOCAL_NOTIFICATION_KEY);
        if (stored) {
          localNotifications = JSON.parse(stored);
        }
      } catch {}

      const settingsToSync = {
        user_id: user.id,
        theme: settings.theme ?? theme,
        sound_enabled: settings.sound_enabled ?? localNotifications.soundEnabled,
        desktop_notifications_enabled: settings.desktop_notifications_enabled ?? localNotifications.desktopEnabled,
        last_synced_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_settings")
        .upsert(settingsToSync, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast.success("Settings synced to cloud");
    },
    onError: () => {
      toast.error("Failed to sync settings");
    },
  });

  // Pull settings from cloud and apply locally
  const pullFromCloudMutation = useMutation({
    mutationFn: async () => {
      const { data } = await refetch();
      if (!data) throw new Error("No cloud settings found");
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        // Apply theme
        if (data.theme) {
          setTheme(data.theme as Theme);
        }
        
        // Apply notification settings to localStorage
        const notificationSettings = {
          soundEnabled: data.sound_enabled ?? true,
          desktopEnabled: data.desktop_notifications_enabled ?? true,
        };
        localStorage.setItem(LOCAL_NOTIFICATION_KEY, JSON.stringify(notificationSettings));
        
        toast.success("Settings restored from cloud");
        // Reload to apply notification settings
        window.location.reload();
      }
    },
    onError: () => {
      toast.error("Failed to restore settings from cloud");
    },
  });

  // Toggle sync enabled
  const setSyncEnabled = useCallback((enabled: boolean) => {
    setSyncEnabledState(enabled);
    localStorage.setItem(LOCAL_SYNC_ENABLED_KEY, JSON.stringify(enabled));
    
    if (enabled && user) {
      // Sync current settings to cloud when enabling
      syncToCloudMutation.mutate({});
    }
  }, [user]);

  // Auto-sync when settings change (if sync is enabled)
  const syncCurrentSettings = useCallback(() => {
    if (syncEnabled && user) {
      syncToCloudMutation.mutate({});
    }
  }, [syncEnabled, user]);

  // Initial sync on login - apply cloud settings if they exist
  useEffect(() => {
    if (cloudSettings && syncEnabled && user) {
      // Only apply on initial load, not on every change
      const hasAppliedInitial = sessionStorage.getItem(`sync_applied_${user.id}`);
      if (!hasAppliedInitial) {
        sessionStorage.setItem(`sync_applied_${user.id}`, "true");
        
        // Apply cloud theme silently
        if (cloudSettings.theme && cloudSettings.theme !== theme) {
          setTheme(cloudSettings.theme as Theme);
        }
        
        // Apply notification settings
        const notificationSettings = {
          soundEnabled: cloudSettings.sound_enabled ?? true,
          desktopEnabled: cloudSettings.desktop_notifications_enabled ?? true,
        };
        localStorage.setItem(LOCAL_NOTIFICATION_KEY, JSON.stringify(notificationSettings));
      }
    }
  }, [cloudSettings, syncEnabled, user]);

  return {
    syncEnabled,
    setSyncEnabled,
    cloudSettings,
    isLoading,
    lastSyncedAt: cloudSettings?.last_synced_at,
    syncToCloud: () => syncToCloudMutation.mutate({}),
    pullFromCloud: () => pullFromCloudMutation.mutate(),
    isSyncing: syncToCloudMutation.isPending,
    isPulling: pullFromCloudMutation.isPending,
    syncCurrentSettings,
  };
};
