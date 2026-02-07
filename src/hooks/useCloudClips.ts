import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Clip } from "./useClipsGallery";

export interface CloudClip {
  id: string;
  user_id: string;
  local_id: string;
  name: string;
  storage_path: string;
  thumbnail_url: string | null;
  duration: number;
  size: number;
  created_at: string;
  updated_at: string;
}

export const useCloudClips = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudClips, setCloudClips] = useState<CloudClip[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  const fetchCloudClips = useCallback(async () => {
    if (!user) return [];
    setIsLoadingCloud(true);
    try {
      const { data, error } = await supabase
        .from("cloud_clips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCloudClips(data || []);
      return data || [];
    } catch (error) {
      console.error("Failed to fetch cloud clips:", error);
      return [];
    } finally {
      setIsLoadingCloud(false);
    }
  }, [user]);

  const uploadClip = useCallback(
    async (clip: Clip) => {
      if (!user) {
        toast.error("Please sign in to backup clips to the cloud");
        return;
      }

      setIsSyncing(true);
      try {
        const storagePath = `${user.id}/${clip.id}.webm`;

        // Upload blob to storage
        const { error: uploadError } = await supabase.storage
          .from("clips")
          .upload(storagePath, clip.blob, {
            contentType: "video/webm",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Save metadata
        const { error: dbError } = await supabase.from("cloud_clips").upsert(
          {
            user_id: user.id,
            local_id: clip.id,
            name: clip.name,
            storage_path: storagePath,
            thumbnail_url: clip.thumbnailUrl || null,
            duration: clip.duration,
            size: clip.size,
          },
          { onConflict: "user_id,local_id" }
        );

        if (dbError) throw dbError;

        toast.success(`"${clip.name}" backed up to cloud`);
        await fetchCloudClips();
      } catch (error) {
        console.error("Failed to upload clip:", error);
        toast.error("Failed to backup clip to cloud");
      } finally {
        setIsSyncing(false);
      }
    },
    [user, fetchCloudClips]
  );

  const uploadAllClips = useCallback(
    async (clips: Clip[]) => {
      if (!user) {
        toast.error("Please sign in to backup clips to the cloud");
        return;
      }
      if (clips.length === 0) {
        toast.info("No clips to backup");
        return;
      }

      setIsSyncing(true);
      let successCount = 0;

      try {
        for (const clip of clips) {
          try {
            const storagePath = `${user.id}/${clip.id}.webm`;

            const { error: uploadError } = await supabase.storage
              .from("clips")
              .upload(storagePath, clip.blob, {
                contentType: "video/webm",
                upsert: true,
              });

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase
              .from("cloud_clips")
              .upsert(
                {
                  user_id: user.id,
                  local_id: clip.id,
                  name: clip.name,
                  storage_path: storagePath,
                  thumbnail_url: clip.thumbnailUrl || null,
                  duration: clip.duration,
                  size: clip.size,
                },
                { onConflict: "user_id,local_id" }
              );

            if (dbError) throw dbError;
            successCount++;
          } catch (err) {
            console.error(`Failed to upload clip "${clip.name}":`, err);
          }
        }

        toast.success(`${successCount}/${clips.length} clips backed up`);
        await fetchCloudClips();
      } finally {
        setIsSyncing(false);
      }
    },
    [user, fetchCloudClips]
  );

  const downloadCloudClip = useCallback(
    async (cloudClip: CloudClip): Promise<Clip | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase.storage
          .from("clips")
          .download(cloudClip.storage_path);

        if (error) throw error;

        return {
          id: cloudClip.local_id,
          name: cloudClip.name,
          blob: data,
          thumbnailUrl: cloudClip.thumbnail_url || "",
          duration: Number(cloudClip.duration),
          createdAt: new Date(cloudClip.created_at),
          size: Number(cloudClip.size),
        };
      } catch (error) {
        console.error("Failed to download cloud clip:", error);
        toast.error("Failed to download clip from cloud");
        return null;
      }
    },
    [user]
  );

  const deleteCloudClip = useCallback(
    async (cloudClip: CloudClip) => {
      if (!user) return;

      try {
        const { error: storageError } = await supabase.storage
          .from("clips")
          .remove([cloudClip.storage_path]);

        if (storageError) throw storageError;

        const { error: dbError } = await supabase
          .from("cloud_clips")
          .delete()
          .eq("id", cloudClip.id);

        if (dbError) throw dbError;

        setCloudClips((prev) => prev.filter((c) => c.id !== cloudClip.id));
        toast.success("Cloud clip deleted");
      } catch (error) {
        console.error("Failed to delete cloud clip:", error);
        toast.error("Failed to delete cloud clip");
      }
    },
    [user]
  );

  const isClipSynced = useCallback(
    (localId: string) => {
      return cloudClips.some((c) => c.local_id === localId);
    },
    [cloudClips]
  );

  return {
    cloudClips,
    isSyncing,
    isLoadingCloud,
    fetchCloudClips,
    uploadClip,
    uploadAllClips,
    downloadCloudClip,
    deleteCloudClip,
    isClipSynced,
  };
};
