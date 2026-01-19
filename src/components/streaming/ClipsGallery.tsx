import { useState } from "react";
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
import { Clip, useClipsGallery } from "@/hooks/useClipsGallery";
import { formatDuration } from "@/hooks/useScreenRecording";
import { ClipTrimmer } from "./ClipTrimmer";

interface ClipsGalleryProps {
  onSaveClip?: (saveFunction: (blob: Blob, duration: number) => Promise<Clip>) => void;
}

export const ClipsGallery = ({ onSaveClip }: ClipsGalleryProps) => {
  const {
    clips,
    isLoading,
    deleteClip,
    renameClip,
    updateClip,
    downloadClip,
    getTotalSize,
    formatSize,
  } = useClipsGallery();

  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [trimmingClip, setTrimmingClip] = useState<Clip | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (clip: Clip) => {
    setEditingId(clip.id);
    setEditName(clip.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      renameClip(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleTrimSave = async (trimmedBlob: Blob, newDuration: number) => {
    if (trimmingClip) {
      await updateClip(trimmingClip.id, trimmedBlob, newDuration);
    }
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Film className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No clips saved yet</p>
              <p className="text-xs mt-1 opacity-70">
                Your recordings will appear here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[280px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="group relative rounded-lg overflow-hidden border border-border/50 bg-muted/30 hover:border-primary/50 transition-all"
                  >
                    {/* Thumbnail */}
                    <div
                      className="aspect-video relative cursor-pointer"
                      onClick={() => setSelectedClip(clip)}
                    >
                      {clip.thumbnailUrl ? (
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Film className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-10 h-10 text-white fill-white" />
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {formatDuration(clip.duration)}
                      </div>
                    </div>

                    {/* Info */}
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleSaveEdit(clip.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-medium truncate" title={clip.name}>
                            {clip.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {formatSize(clip.size)}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrimmingClip(clip);
                                }}
                                title="Trim clip"
                              >
                                <Scissors className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleStartEdit(clip)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => downloadClip(clip)}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete clip?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{clip.name}". This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteClip(clip.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
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
              <video
                src={URL.createObjectURL(selectedClip.blob)}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Duration: {formatDuration(selectedClip.duration)} • Size:{" "}
                  {formatSize(selectedClip.size)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedClip(null);
                    setTrimmingClip(selectedClip);
                  }}
                  className="gap-2"
                >
                  <Scissors className="w-4 h-4" />
                  Trim
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadClip(selectedClip)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clip Trimmer */}
      <ClipTrimmer
        clip={trimmingClip}
        open={!!trimmingClip}
        onClose={() => setTrimmingClip(null)}
        onSave={handleTrimSave}
      />
    </>
  );
};
