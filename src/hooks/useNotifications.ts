import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: "friend_request" | "message";
  title: string;
  description: string;
  avatar?: string;
  timestamp: string;
  read: boolean;
  actionId?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch pending friend requests
      const { data: friendRequests } = await supabase
        .from("friendships")
        .select("id, created_at, user_id")
        .eq("friend_id", user.id)
        .eq("status", "pending");

      // Get sender profiles for friend requests
      const senderIds = friendRequests?.map(f => f.user_id) || [];
      let senderProfiles: Record<string, { username: string | null; avatar_url: string | null }> = {};
      
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", senderIds);
        
        profiles?.forEach(p => {
          senderProfiles[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
        });
      }

      // Fetch unread messages
      const { data: conversations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const conversationIds = conversations?.map(c => c.conversation_id) || [];
      
      let unreadMessages: { id: string; sender_id: string; content: string; created_at: string; conversation_id: string }[] = [];
      
      if (conversationIds.length > 0) {
        const { data: messages } = await supabase
          .from("messages")
          .select("id, sender_id, content, created_at, conversation_id")
          .in("conversation_id", conversationIds)
          .neq("sender_id", user.id)
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(10);
        
        unreadMessages = messages || [];
      }

      // Get sender profiles for messages
      const messageSenderIds = [...new Set(unreadMessages.map(m => m.sender_id))];
      let messageSenderProfiles: Record<string, { username: string | null; avatar_url: string | null }> = {};
      
      if (messageSenderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", messageSenderIds);
        
        profiles?.forEach(p => {
          messageSenderProfiles[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
        });
      }

      // Build notifications list
      const notificationsList: Notification[] = [];

      // Add friend requests
      friendRequests?.forEach(request => {
        const sender = senderProfiles[request.user_id];
        notificationsList.push({
          id: `fr_${request.id}`,
          type: "friend_request",
          title: "Friend Request",
          description: `${sender?.username || "Someone"} wants to be your friend`,
          avatar: sender?.avatar_url || undefined,
          timestamp: request.created_at,
          read: false,
          actionId: request.id,
        });
      });

      // Add unread messages (group by sender, show latest)
      const messagesBySender = new Map<string, typeof unreadMessages[0]>();
      unreadMessages.forEach(msg => {
        if (!messagesBySender.has(msg.sender_id)) {
          messagesBySender.set(msg.sender_id, msg);
        }
      });

      messagesBySender.forEach((msg, senderId) => {
        const sender = messageSenderProfiles[senderId];
        const count = unreadMessages.filter(m => m.sender_id === senderId).length;
        notificationsList.push({
          id: `msg_${msg.id}`,
          type: "message",
          title: sender?.username || "Someone",
          description: count > 1 ? `${count} new messages` : msg.content.substring(0, 50),
          avatar: sender?.avatar_url || undefined,
          timestamp: msg.created_at,
          read: false,
          actionId: msg.conversation_id,
        });
      });

      // Sort by timestamp
      notificationsList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(notificationsList);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to realtime updates
      const friendshipChannel = supabase
        .channel("notifications-friendships")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "friendships",
            filter: `friend_id=eq.${user.id}`,
          },
          () => fetchNotifications()
        )
        .subscribe();

      const messagesChannel = supabase
        .channel("notifications-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          () => fetchNotifications()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(friendshipChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
  };
};
