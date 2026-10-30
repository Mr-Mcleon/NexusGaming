import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserProfile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  sender_profile?: UserProfile;
  receiver_profile?: UserProfile;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = useCallback(async () => {
    if (!user) return;

    const { data, error: fetchError } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (fetchError) {
      toast.error("Couldn't load friends");
      setLoading(false);
      return;
    }

    if (!data) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      return;
    }

    // Get all user IDs involved
    const userIds = [...new Set(data.flatMap(f => [f.user_id, f.friend_id]))];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", userIds);

    const enrichedData: FriendRequest[] = data.map(friendship => ({
      ...friendship,
      status: friendship.status as "pending" | "accepted" | "blocked",
      sender_profile: profiles?.find(p => p.user_id === friendship.user_id),
      receiver_profile: profiles?.find(p => p.user_id === friendship.friend_id),
    }));

    // Categorize friendships
    const accepted = enrichedData.filter(f => f.status === "accepted");
    const pending = enrichedData.filter(f => 
      f.status === "pending" && f.friend_id === user.id
    );
    const sent = enrichedData.filter(f => 
      f.status === "pending" && f.user_id === user.id
    );

    setFriends(accepted);
    setPendingRequests(pending);
    setSentRequests(sent);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFriendships();
    }
  }, [user, fetchFriendships]);

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
    if (!query.trim() || !user) return [];

    const { data } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .neq("user_id", user.id)
      .limit(10);

    return data || [];
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return false;

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      toast.error("Friend request already exists or you're already friends");
      return false;
    }

    const { error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: friendId,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to send friend request");
      return false;
    }

    toast.success("Friend request sent!");
    await fetchFriendships();
    return true;
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) return false;
    // Only the recipient may accept (also enforced server-side).
    const { data, error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", requestId)
      .eq("friend_id", user.id)
      .eq("status", "pending")
      .select("id");

    if (error || !data?.length) {
      toast.error("Failed to accept request");
      return false;
    }

    toast.success("Friend request accepted!");
    await fetchFriendships();
    return true;
  };

  const declineRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to decline request");
      return false;
    }

    toast.success("Friend request declined");
    await fetchFriendships();
    return true;
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      toast.error("Failed to remove friend");
      return false;
    }

    toast.success("Friend removed");
    await fetchFriendships();
    return true;
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refresh: fetchFriendships,
  };
};
