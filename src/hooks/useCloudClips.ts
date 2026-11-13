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
      toast.error("Failed to load cloud clips; existing results have been kept");
      return null;
    } finally {
      setIsLoadingCloud(false);
    }
  }, [user]);

  const persistClip = useCallback(async (clip: Clip) => {
    if (!user) throw new Error("Not signed in");
    const { data: previous, error: lookupError } = await supabase
      .from("cloud_clips").select("storage_path")
      .eq("user_id", user.id).eq("local_id", clip.id).maybeSingle();
    if (lookupError) throw lookupError;

    // Never overwrite an existing backup before its replacement metadata is saved.
    const storagePath = `${user.id}/${clip.id}-${crypto.randomUUID()}.webm`;
    const { error: uploadError } = await supabase.storage.from("clips")
      .upload(storagePath, clip.blob, { contentType: "video/webm", upsert: false });
    if (uploadError) throw uploadError;

    try {
      const { data, error } = await supabase.from("cloud_clips").upsert({
        user_id: user.id, local_id: clip.id, name: clip.name,
        storage_path: storagePath, thumbnail_url: clip.thumbnailUrl || null,
        duration: clip.duration, size: clip.size,
      }, { onConflict: "user_id,local_id" }).select("id").single();
      if (error) throw error;
      if (!data) throw new Error("Clip metadata was not saved");
    } catch (error) {
      // A lost response may hide a committed write: check before removing its object.
      const { data: committed, error: checkError } = await supabase.from("cloud_clips")
        .select("id").eq("user_id", user.id).eq("storage_path", storagePath).maybeSingle();
      if (checkError) {
        toast.error("Backup could not be verified; its file was retained for safety");
        throw error;
      }
      if (!committed) {
        const { error: cleanupError } = await supabase.storage.from("clips").remove([storagePath]);
        if (cleanupError) {
          console.error("Failed to clean up unsaved clip:", cleanupError);
          toast.error("Backup failed and its uploaded file could not be cleaned up");
        }
        throw error;
      }
    }

    if (previous && previous.storage_path !== storagePath) {
      const { error: cleanupError } = await supabase.storage.from("clips").remove([previous.storage_path]);
      if (cleanupError) {
        console.error("Failed to clean up replaced clip:", cleanupError);
        toast.warning("Backup saved, but the previous file could not be cleaned up");
      }
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
        await persistClip(clip);

        toast.success(`"${clip.name}" backed up to cloud`);
        await fetchCloudClips();
      } catch (error) {
        console.error("Failed to upload clip:", error);
        toast.error("Failed to backup clip to cloud");
      } finally {
        setIsSyncing(false);
      }
    },
    [user, fetchCloudClips, persistClip]
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
            await persistClip(clip);
            successCount++;
          } catch (err) {
            console.error(`Failed to upload clip "${clip.name}":`, err);
          }
        }

        if (successCount === 0) toast.error(`No clips backed up; ${clips.length} failed`);
        else if (successCount < clips.length) toast.warning(`${successCount}/${clips.length} clips backed up; ${clips.length - successCount} failed`);
        else toast.success(`${successCount}/${clips.length} clips backed up`);
        await fetchCloudClips();
      } finally {
        setIsSyncing(false);
      }
    },
    [user, fetchCloudClips, persistClip]
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
        // Keep a temporary copy so metadata failures can restore the deleted file.
        const { data: backup, error: backupError } = await supabase.storage
          .from("clips").download(cloudClip.storage_path);
        if (backupError) throw backupError;
        if (!backup) throw new Error("Could not preserve clip for rollback");

        const { error: storageError } = await supabase.storage
          .from("clips")
          .remove([cloudClip.storage_path]);

        if (storageError) throw storageError;

        const { data: deleted, error: dbError } = await supabase
          .from("cloud_clips")
          .delete()
          .eq("id", cloudClip.id)
          .eq("user_id", user.id)
          .eq("storage_path", cloudClip.storage_path)
          .select("id");

        if (dbError || !deleted?.length) {
          const { data: remaining, error: checkError } = await supabase.from("cloud_clips")
            .select("id").eq("user_id", user.id)
            .eq("storage_path", cloudClip.storage_path).maybeSingle();
          if (checkError || remaining) {
            const { error: restoreError } = await supabase.storage.from("clips")
              .upload(cloudClip.storage_path, backup, { contentType: "video/webm", upsert: false });
            if (restoreError) {
              console.error("Failed to restore clip after metadata deletion failure:", restoreError);
              toast.error("Clip deletion failed and its file could not be restored; retry is needed");
            }
          }
          throw dbError || new Error("Clip changed or metadata deletion was not confirmed");
        }

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
