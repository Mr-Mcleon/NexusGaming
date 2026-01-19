import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Clip {
  id: string;
  name: string;
  blob: Blob;
  thumbnailUrl: string;
  duration: number;
  createdAt: Date;
  size: number;
}

const DB_NAME = "nexus-clips-db";
const DB_VERSION = 1;
const STORE_NAME = "clips";

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
};

const generateThumbnail = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(blob);
    video.src = url;
    video.muted = true;
    video.currentTime = 1; // Capture frame at 1 second

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve("");
      }
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
  });
};

export const useClipsGallery = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadClips = useCallback(async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const loadedClips = request.result.map((clip: any) => ({
          ...clip,
          createdAt: new Date(clip.createdAt),
        }));
        // Sort by newest first
        loadedClips.sort((a: Clip, b: Clip) => b.createdAt.getTime() - a.createdAt.getTime());
        setClips(loadedClips);
        setIsLoading(false);
      };

      request.onerror = () => {
        console.error("Failed to load clips:", request.error);
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Failed to open database:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  const saveClip = useCallback(async (blob: Blob, duration: number, customName?: string) => {
    try {
      const id = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const name = customName || `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      const thumbnailUrl = await generateThumbnail(blob);

      const clip: Clip = {
        id,
        name,
        blob,
        thumbnailUrl,
        duration,
        createdAt: new Date(),
        size: blob.size,
      };

      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      return new Promise<Clip>((resolve, reject) => {
        const request = store.add(clip);

        request.onsuccess = () => {
          setClips((prev) => [clip, ...prev]);
          toast.success("Clip saved to gallery!");
          resolve(clip);
        };

        request.onerror = () => {
          toast.error("Failed to save clip");
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Failed to save clip:", error);
      toast.error("Failed to save clip");
      throw error;
    }
  }, []);

  const deleteClip = useCallback(async (id: string) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);

        request.onsuccess = () => {
          setClips((prev) => prev.filter((clip) => clip.id !== id));
          toast.success("Clip deleted");
          resolve();
        };

        request.onerror = () => {
          toast.error("Failed to delete clip");
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Failed to delete clip:", error);
      toast.error("Failed to delete clip");
      throw error;
    }
  }, []);

  const renameClip = useCallback(async (id: string, newName: string) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const clip = getRequest.result;
        if (clip) {
          clip.name = newName;
          const putRequest = store.put(clip);
          putRequest.onsuccess = () => {
            setClips((prev) =>
              prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
            );
            toast.success("Clip renamed");
          };
        }
      };
    } catch (error) {
      console.error("Failed to rename clip:", error);
      toast.error("Failed to rename clip");
    }
  }, []);

  const updateClip = useCallback(async (id: string, newBlob: Blob, newDuration: number) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      return new Promise<void>((resolve, reject) => {
        getRequest.onsuccess = async () => {
          const clip = getRequest.result;
          if (clip) {
            const newThumbnail = await generateThumbnail(newBlob);
            clip.blob = newBlob;
            clip.duration = newDuration;
            clip.size = newBlob.size;
            clip.thumbnailUrl = newThumbnail;
            
            const putRequest = store.put(clip);
            putRequest.onsuccess = () => {
              setClips((prev) =>
                prev.map((c) =>
                  c.id === id
                    ? { ...c, blob: newBlob, duration: newDuration, size: newBlob.size, thumbnailUrl: newThumbnail }
                    : c
                )
              );
              toast.success("Clip trimmed successfully!");
              resolve();
            };
            putRequest.onerror = () => {
              toast.error("Failed to save trimmed clip");
              reject(putRequest.error);
            };
          }
        };

        getRequest.onerror = () => {
          toast.error("Failed to update clip");
          reject(getRequest.error);
        };
      });
    } catch (error) {
      console.error("Failed to update clip:", error);
      toast.error("Failed to update clip");
      throw error;
    }
  }, []);

  const downloadClip = useCallback((clip: Clip) => {
    const url = URL.createObjectURL(clip.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clip.name.replace(/[^a-z0-9]/gi, "-")}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Clip downloaded!");
  }, []);

  const getTotalSize = useCallback(() => {
    return clips.reduce((total, clip) => total + clip.size, 0);
  }, [clips]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return {
    clips,
    isLoading,
    saveClip,
    deleteClip,
    renameClip,
    updateClip,
    downloadClip,
    getTotalSize,
    formatSize,
    refreshClips: loadClips,
  };
};
