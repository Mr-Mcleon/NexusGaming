import { useState, useEffect } from "react";
import {
  Film,
  Download,
  Trash2,
  Play,
  X,
  Edit2,
  Check,
  HardDrive,
  Scissors,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clip, useClipsGallery } from "@/hooks/useClipsGallery";
import { useCloudClips, CloudClip } from "@/hooks/useCloudClips";
import { useAuth } from "@/contexts/AuthContext";
import { formatDuration } from "@/hooks/useScreenRecording";
import { ClipEditor } from "./ClipEditor";
import { ClipFilterBar, useClipFilters } from "./ClipFilterBar";

interface ClipsGalleryProps {
  onSaveClip?: (saveFunction: (blob: Blob, duration: number) => Promise<Clip>) => void;
}

export const ClipsGallery = ({ onSaveClip }: ClipsGalleryProps) => {
  const { user } = useAuth();
  const {
    clips,
    isLoading,
    saveClip,
    deleteClip,
    renameClip,
    updateClip,
    downloadClip,
    getTotalSize,
    formatSize,
  } = useClipsGallery();

  const {
    cloudClips,
    isSyncing,
    isLoadingCloud,
    fetchCloudClips,
    uploadClip,
    uploadAllClips,
    downloadCloudClip,
    deleteCloudClip,
    isClipSynced,
  } = useCloudClips();

  const { filters, setFilters, activeCount, clearFilters, filterLocalClips, filterCloudClips } = useClipFilters();

  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [editingClip, setEditingClip] = useState<Clip | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredClips = filterLocalClips(clips);
  const filteredCloudClips = filterCloudClips(cloudClips);

  useEffect(() => {
    if (user) fetchCloudClips();
  }, [user, fetchCloudClips]);

  const handleStartEdit = (clip: Clip) => {
    setEditingId(clip.id);
    setEditName(clip.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) renameClip(id, editName.trim());
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleEditorSave = async (editedBlob: Blob, newDuration: number) => {
    if (editingClip) await updateClip(editingClip.id, editedBlob, newDuration);
  };

  const handleRestoreFromCloud = async (cloudClip: CloudClip) => {
    setDownloadingId(cloudClip.id);
    try {
      const clip = await downloadCloudClip(cloudClip);
      if (clip) {
        await saveClip(clip.blob, clip.duration, clip.name);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const renderLocalClipCard = (clip: Clip) => (
    <div
      key={clip.id}
      className="group relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 hover:border-primary/50 transition-all"
    >
      <div className="aspect-video relative cursor-pointer" onClick={() => setSelectedClip(clip)}>
        {clip.thumbnailUrl ? (
          <img src={clip.thumbnailUrl} alt={clip.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white fill-white" />
        </div>
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
          {formatDuration(clip.duration)}
        </div>
        {user && isClipSynced(clip.id) && (
          <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Cloud className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="p-2">
        {editingId === clip.id ? (
          <div className="flex items-center gap-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-6 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit(clip.id);
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(clip.id)}>
              <Check className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium truncate" title={clip.name}>{clip.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{formatSize(clip.size)}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {user && !isClipSynced(clip.id) && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => uploadClip(clip)} disabled={isSyncing} title="Backup to cloud">
                    <CloudUpload className="w-3 h-3" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditingClip(clip); }} title="Edit clip">
                  <Scissors className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(clip)}>
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => downloadClip(clip)}>
                  <Download className="w-3 h-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete clip?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{clip.name}" locally. Cloud backup (if any) will remain.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteClip(clip.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderCloudClipCard = (cloudClip: CloudClip) => {
    const isLocal = clips.some((c) => c.id === cloudClip.local_id);
    const isDownloading = downloadingId === cloudClip.id;

    return (
      <div key={cloudClip.id} className="group relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 hover:border-primary/50 transition-all">
        <div className="aspect-video relative">
          {cloudClip.thumbnail_url ? (
            <img src={cloudClip.thumbnail_url} alt={cloudClip.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Cloud className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(Number(cloudClip.duration))}
          </div>
          {isLocal && (
            <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium truncate" title={cloudClip.name}>{cloudClip.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{formatSize(Number(cloudClip.size))}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isLocal && (
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRestoreFromCloud(cloudClip)} disabled={isDownloading} title="Restore locally">
                  <CloudDownload className={`w-3 h-3 ${isDownloading ? "animate-spin" : ""}`} />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete cloud backup?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{cloudClip.name}" from the cloud. Local copy (if any) will remain.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteCloudClip(cloudClip)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Film className="w-5 h-5 text-primary" />
              Clips Gallery
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              <span>{formatSize(getTotalSize())}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="local" className="w-full">
            <ClipFilterBar filters={filters} setFilters={setFilters} activeCount={activeCount} clearFilters={clearFilters} />
            <div className="flex items-center justify-between mb-3">
              <TabsList className="h-8">
                <TabsTrigger value="local" className="text-xs px-3 h-7">
                  <HardDrive className="w-3 h-3 mr-1" /> Local
                </TabsTrigger>
                <TabsTrigger value="cloud" className="text-xs px-3 h-7" disabled={!user}>
                  <Cloud className="w-3 h-3 mr-1" /> Cloud
                </TabsTrigger>
              </TabsList>

              {user && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => uploadAllClips(clips)} disabled={isSyncing || clips.length === 0}>
                    <CloudUpload className="w-3 h-3" />
                    {isSyncing ? "Syncing..." : "Backup All"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchCloudClips} disabled={isLoadingCloud}>
                    <RefreshCw className={`w-3 h-3 ${isLoadingCloud ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="local" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : clips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Film className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No clips saved yet</p>
                  <p className="text-xs mt-1 opacity-70">Your recordings will appear here</p>
                </div>
              ) : filteredClips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No clips match your filters</p>
                  <Button variant="link" size="sm" className="text-xs mt-1" onClick={clearFilters}>Clear filters</Button>
                </div>
              ) : (
                <ScrollArea className="h-[280px] pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    {filteredClips.map(renderLocalClipCard)}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="cloud" className="mt-0">
              {!user ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Cloud className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Sign in to access cloud backups</p>
                </div>
              ) : isLoadingCloud ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : cloudClips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Cloud className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No cloud backups yet</p>
                  <p className="text-xs mt-1 opacity-70">Backup your local clips to sync across devices</p>
                </div>
              ) : filteredCloudClips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No cloud clips match your filters</p>
                  <Button variant="link" size="sm" className="text-xs mt-1" onClick={clearFilters}>Clear filters</Button>
                </div>
              ) : (
                <ScrollArea className="h-[280px] pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    {filteredCloudClips.map(renderCloudClipCard)}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedClip} onOpenChange={() => setSelectedClip(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedClip?.name}</DialogTitle>
          </DialogHeader>
          {selectedClip && (
            <div className="space-y-4">
              <video src={URL.createObjectURL(selectedClip.blob)} controls autoPlay className="w-full rounded-lg" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Duration: {formatDuration(selectedClip.duration)} • Size: {formatSize(selectedClip.size)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedClip(null); setEditingClip(selectedClip); }} className="gap-2">
                    <Scissors className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadClip(selectedClip)} className="gap-2">
                    <Download className="w-4 h-4" /> Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ClipEditor clip={editingClip} open={!!editingClip} onClose={() => setEditingClip(null)} onSave={handleEditorSave} />
    </>
  );
};
