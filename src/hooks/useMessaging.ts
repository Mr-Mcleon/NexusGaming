import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    username: string | null;
    avatar_url: string | null;
  }[];
  last_message?: Message;
  unread_count: number;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
  friend_profile?: {
    user_id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useMessaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participations?.length) {
      setConversations([]);
      return;
    }

    const conversationIds = participations.map(p => p.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (!convos) {
      setConversations([]);
      return;
    }

    // Fetch participants for each conversation
    const conversationsWithDetails = await Promise.all(
      convos.map(async (convo) => {
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convo.id);

        const participantIds = participants?.map(p => p.user_id) || [];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", participantIds);

        // Get last message
        const { data: lastMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: false })
          .limit(1);

        // Get unread count
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convo.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        return {
          ...convo,
          participants: profiles || [],
          last_message: lastMessages?.[0],
          unread_count: count || 0,
        };
      })
    );

    setConversations(conversationsWithDetails);
  }, [user]);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (!data) {
      setFriends([]);
      return;
    }

    // Get profiles for friends
    const friendIds = data.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", friendIds);

    const friendsWithProfiles: Friend[] = data.map(friendship => ({
      ...friendship,
      status: friendship.status as "pending" | "accepted" | "blocked",
      friend_profile: profiles?.find(p => 
        p.user_id === (friendship.user_id === user.id ? friendship.friend_id : friendship.user_id)
      ),
    }));

    setFriends(friendsWithProfiles);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchFriends()]);
      setLoading(false);
    };
    
    if (user) {
      loadData();
    }
  }, [user, fetchConversations, fetchFriends]);

  // Start or get conversation with a user
  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: myParticipations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myParticipations?.length) {
      for (const participation of myParticipations) {
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", participation.conversation_id)
          .eq("user_id", otherUserId)
          .maybeSingle();

        if (otherParticipant) {
          return participation.conversation_id;
        }
      }
    }

    // Create new conversation
    const { data: newConvo, error: convoError } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (convoError || !newConvo) return null;

    // Add participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: newConvo.id, user_id: user.id },
      { conversation_id: newConvo.id, user_id: otherUserId },
    ]);

    await fetchConversations();
    return newConvo.id;
  };

  return {
    conversations,
    friends,
    loading,
    startConversation,
    refreshConversations: fetchConversations,
    refreshFriends: fetchFriends,
  };
};

export const useConversation = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!data) {
      setMessages([]);
      return;
    }

    // Get sender profiles
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", senderIds);

    const messagesWithSenders = data.map(msg => ({
      ...msg,
      sender: profiles?.find(p => p.user_id === msg.sender_id),
    }));

    setMessages(messagesWithSenders);
    setLoading(false);
  }, [conversationId]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Get sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, username, avatar_url")
            .eq("user_id", newMessage.sender_id)
            .maybeSingle();

          setMessages(prev => [...prev, { ...newMessage, sender: profile || undefined }]);
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const indicator = payload.new as { user_id: string; updated_at: string };
            if (indicator.user_id !== user?.id) {
              setTypingUsers(prev => 
                prev.includes(indicator.user_id) ? prev : [...prev, indicator.user_id]
              );
              // Auto-remove after 3 seconds
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(id => id !== indicator.user_id));
              }, 3000);
            }
          } else if (payload.eventType === "DELETE") {
            const indicator = payload.old as { user_id: string };
            setTypingUsers(prev => prev.filter(id => id !== indicator.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, user?.id, fetchMessages]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!user || !conversationId || !content.trim()) return;

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    });

    // Clear typing indicator
    await supabase
      .from("typing_indicators")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
  };

  // Update typing indicator
  const setTyping = async (isTyping: boolean) => {
    if (!user || !conversationId) return;

    if (isTyping) {
      await supabase.from("typing_indicators").upsert({
        conversation_id: conversationId,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabase
        .from("typing_indicators")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    if (!user || !conversationId) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);
  };

  return {
    messages,
    typingUsers,
    loading,
    sendMessage,
    setTyping,
    markAsRead,
  };
};
