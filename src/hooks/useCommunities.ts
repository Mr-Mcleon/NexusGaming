import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Community {
  id: string;
  name: string;
  description: string;
  icon: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  online_count?: number;
  is_member?: boolean;
}

export interface CommunityChannel {
  id: string;
  community_id: string;
  name: string;
  type: "text" | "voice";
  position: number;
  created_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export const useCommunities = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommunities = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all public communities
      const { data: allCommunities } = await (supabase
        .from("communities" as any)
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false }) as any);

      // Fetch my memberships
      const { data: myMemberships } = await (supabase
        .from("community_members" as any)
        .select("community_id")
        .eq("user_id", user.id) as any);

      const myIds = new Set((myMemberships || []).map((m: any) => m.community_id));

      const enriched = (allCommunities || []).map((c: any) => ({
        ...c,
        is_member: myIds.has(c.id),
      }));

      setCommunities(enriched);
      setMyCommunities(enriched.filter((c: any) => c.is_member));
    } catch (err) {
      console.error("Failed to fetch communities:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchCommunities();
  }, [user, fetchCommunities]);

  const createCommunity = async (name: string, description: string, icon: string) => {
    if (!user) return null;

    try {
      const { data: community, error } = await (supabase
        .from("communities" as any)
        .insert({ name, description, icon, owner_id: user.id } as any)
        .select()
        .single() as any);

      if (error) throw error;

      // Add owner as member with owner role
      await (supabase
        .from("community_members" as any)
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: "owner",
        } as any) as any);

      // Create default channels
      await (supabase
        .from("community_channels" as any)
        .insert([
          { community_id: community.id, name: "general", type: "text", position: 0 },
          { community_id: community.id, name: "Voice Lobby", type: "voice", position: 1 },
        ] as any) as any);

      toast.success(`"${name}" community created!`);
      await fetchCommunities();
      return community;
    } catch (err) {
      console.error("Failed to create community:", err);
      toast.error("Failed to create community");
      return null;
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      const { error } = await (supabase
        .from("community_members" as any)
        .insert({ community_id: communityId, user_id: user.id, role: "member" } as any) as any);

      if (error) throw error;
      toast.success("Joined community!");
      await fetchCommunities();
    } catch (err) {
      console.error("Failed to join:", err);
      toast.error("Failed to join community");
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      const { error } = await (supabase
        .from("community_members" as any)
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user.id) as any);

      if (error) throw error;
      toast.success("Left community");
      await fetchCommunities();
    } catch (err) {
      console.error("Failed to leave:", err);
      toast.error("Failed to leave community");
    }
  };

  return {
    communities,
    myCommunities,
    loading,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    refreshCommunities: fetchCommunities,
  };
};

export const useCommunityDetails = (communityId: string | null) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!communityId || !user) return;
    setLoading(true);

    try {
      const [channelsRes, membersRes] = await Promise.all([
        supabase
          .from("community_channels" as any)
          .select("*")
          .eq("community_id", communityId)
          .order("position", { ascending: true }) as any,
        supabase
          .from("community_members" as any)
          .select("*")
          .eq("community_id", communityId) as any,
      ]);

      const channelData = (channelsRes.data || []) as CommunityChannel[];
      const memberData = (membersRes.data || []) as CommunityMember[];

      // Fetch profiles for members
      if (memberData.length > 0) {
        const userIds = memberData.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);

        memberData.forEach((m) => {
          m.profile = profiles?.find((p) => p.user_id === m.user_id) || undefined;
        });
      }

      setChannels(channelData);
      setMembers(memberData);
    } catch (err) {
      console.error("Failed to fetch community details:", err);
    } finally {
      setLoading(false);
    }
  }, [communityId, user]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const createChannel = async (name: string, type: "text" | "voice") => {
    if (!communityId) return;

    try {
      const { error } = await (supabase
        .from("community_channels" as any)
        .insert({
          community_id: communityId,
          name,
          type,
          position: channels.length,
        } as any) as any);

      if (error) throw error;
      toast.success(`#${name} channel created`);
      await fetchDetails();
    } catch (err) {
      console.error("Failed to create channel:", err);
      toast.error("Failed to create channel");
    }
  };

  return { channels, members, loading, createChannel, refreshDetails: fetchDetails };
};
