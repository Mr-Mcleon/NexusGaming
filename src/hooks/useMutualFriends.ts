import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MutualFriend {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

export const useMutualFriends = (profileUserId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["mutual-friends", user?.id, profileUserId],
    queryFn: async (): Promise<MutualFriend[]> => {
      if (!user || !profileUserId || user.id === profileUserId) return [];

      // Get my accepted friends
      const { data: myFriendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      // Get their accepted friends
      const { data: theirFriendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${profileUserId},friend_id.eq.${profileUserId}`)
        .eq("status", "accepted");

      if (!myFriendships || !theirFriendships) return [];

      const myFriendIds = new Set(
        myFriendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id)
      );
      const theirFriendIds = new Set(
        theirFriendships.map(f => f.user_id === profileUserId ? f.friend_id : f.user_id)
      );

      const mutualIds = [...myFriendIds].filter(id => theirFriendIds.has(id));
      if (mutualIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", mutualIds);

      return (profiles || []) as MutualFriend[];
    },
    enabled: !!user && !!profileUserId && user.id !== profileUserId,
  });
};
