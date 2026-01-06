import { useCallback, useEffect, useRef } from "react";
import { useNotificationSettings } from "./useNotificationSettings";

// Simple notification sound (base64 encoded short beep)
const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAAAEprn9LWwINJEjt6qdDTpF4OACH/qt/Xq2IZAAA+cZ3K0sCCSRQ7e6rR1KVfDwAh/qvg2KxjGgAAP3KeytPBg0oVO3yr0tWmYBABI/6s4dmtZBsAAEB0n8vUwoRLFjx9rNPWp2ERAZD+reLarWUcAABBdaDM1cOFTBc9fq3U16hiEgKR/67j265mHQAAQnahzdbEhk0YPn+u1diqYxMDkv+v5NyvZx4AAEA=";

export const useNotificationAlerts = () => {
  const { soundEnabled, desktopEnabled } = useNotificationSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;

    // Check notification permission
    if ("Notification" in window) {
      permissionRef.current = Notification.permission;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      permissionRef.current = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      permissionRef.current = permission;
      return permission === "granted";
    }

    return false;
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors - user interaction required first
      });
    }
  }, [soundEnabled]);

  const showDesktopNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || !desktopEnabled) return;

    if (permissionRef.current === "granted") {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [desktopEnabled]);

  const notifyNewMessage = useCallback((senderName: string, messagePreview: string) => {
    playSound();
    showDesktopNotification(`New message from ${senderName}`, {
      body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + "..." : messagePreview,
      tag: "message",
    });
  }, [playSound, showDesktopNotification]);

  const notifyFriendRequest = useCallback((senderName: string) => {
    playSound();
    showDesktopNotification("New Friend Request", {
      body: `${senderName} sent you a friend request`,
      tag: "friend-request",
    });
  }, [playSound, showDesktopNotification]);

  return {
    requestPermission,
    playSound,
    showDesktopNotification,
    notifyNewMessage,
    notifyFriendRequest,
  };
};
