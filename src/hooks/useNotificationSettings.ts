import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "notification_settings";

interface NotificationSettings {
  soundEnabled: boolean;
  desktopEnabled: boolean;
}

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  desktopEnabled: true,
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, soundEnabled: enabled }));
  }, []);

  const setDesktopEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, desktopEnabled: enabled }));
  }, []);

  return {
    soundEnabled: settings.soundEnabled,
    desktopEnabled: settings.desktopEnabled,
    setSoundEnabled,
    setDesktopEnabled,
  };
};
