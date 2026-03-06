import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChannelMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  sender?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export const useChannelChat = (channelId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);

    try {
      const { data } = await (supabase
        .from("channel_messages" as any)
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(100) as any);

      if (!data) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const senderIds = [...new Set(data.map((m: any) => m.sender_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", senderIds);

      const enriched = data.map((m: any) => ({
        ...m,
        sender: profiles?.find((p) => p.user_id === m.sender_id),
      }));

      setMessages(enriched);
    } catch (err) {
      console.error("Failed to fetch channel messages:", err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    fetchMessages();

    const channel = supabase
      .channel(`channel_messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, username, avatar_url")
            .eq("user_id", msg.sender_id)
            .maybeSingle();

          setMessages((prev) => [...prev, { ...msg, sender: profile || undefined }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, fetchMessages]);

  const sendMessage = async (content: string, file?: { url: string; name: string; type: string }) => {
    if (!user || !channelId || (!content.trim() && !file)) return;

    await (supabase.from("channel_messages" as any).insert({
      channel_id: channelId,
      sender_id: user.id,
      content: content.trim() || file?.name || "",
      file_url: file?.url || null,
      file_name: file?.name || null,
      file_type: file?.type || null,
    } as any) as any);
  };

  return { messages, loading, sendMessage };
};
