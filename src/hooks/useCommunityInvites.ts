import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CommunityInvite {
  id: string;
  community_id: string;
  created_by: string;
  invite_code: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export const useCommunityInvites = (communityId: string | null) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<CommunityInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!communityId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("community_invites" as any)
        .select("*")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;
      setInvites((data || []) as CommunityInvite[]);
    } catch (err) {
      console.error("Failed to fetch invites:", err);
    } finally {
      setLoading(false);
    }
  }, [communityId, user]);

  const createInvite = async (options?: { maxUses?: number; expiresInHours?: number }) => {
    if (!communityId || !user) return null;

    try {
      const insertData: any = {
        community_id: communityId,
        created_by: user.id,
      };

      if (options?.maxUses) insertData.max_uses = options.maxUses;
      if (options?.expiresInHours) {
        const expires = new Date();
        expires.setHours(expires.getHours() + options.expiresInHours);
        insertData.expires_at = expires.toISOString();
      }

      const { data, error } = await (supabase
        .from("community_invites" as any)
        .insert(insertData)
        .select()
        .single() as any);

      if (error) throw error;

      const invite = data as CommunityInvite;
      toast.success("Invite link created!");
      await fetchInvites();
      return invite;
    } catch (err) {
      console.error("Failed to create invite:", err);
      toast.error("Failed to create invite");
      return null;
    }
  };

  const revokeInvite = async (inviteId: string) => {
    try {
      const { error } = await (supabase
        .from("community_invites" as any)
        .update({ is_active: false } as any)
        .eq("id", inviteId) as any);

      if (error) throw error;
      toast.success("Invite revoked");
      await fetchInvites();
    } catch (err) {
      console.error("Failed to revoke invite:", err);
      toast.error("Failed to revoke invite");
    }
  };

  return { invites, loading, fetchInvites, createInvite, revokeInvite };
};

export const useAcceptInvite = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const acceptInvite = async (inviteCode: string) => {
    if (!user) return null;
    setLoading(true);

    try {
      const { data, error } = await (supabase.rpc as any)("accept_community_invite", {
        p_invite_code: inviteCode,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        toast.error(result.error);
        return null;
      }
      if (result?.already_member) {
        toast.info("You're already a member of this community");
        return result.community_id;
      }
      toast.success("You've joined the community!");
      return result.community_id;
    } catch (err) {
      console.error("Failed to accept invite:", err);
      toast.error("Failed to accept invite");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { acceptInvite, loading };
};

export const getInviteUrl = (inviteCode: string) => {
  return `${window.location.origin}/invite/${inviteCode}`;
};
