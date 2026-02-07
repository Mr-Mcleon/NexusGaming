import { useState } from "react";
import { 
  Video, 
  Circle, 
  Square, 
  Pause, 
  Play, 
  Download, 
  RotateCcw,
  Monitor,
  Mic,
  MicOff,
  Save,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useScreenRecording, formatDuration } from "@/hooks/useScreenRecording";
import { useClipsGallery } from "@/hooks/useClipsGallery";
import { useCloudClips } from "@/hooks/useCloudClips";
import { useAuth } from "@/contexts/AuthContext";

export const StreamerCard = () => {
  const { user } = useAuth();
  const {
    state,
    duration,
    finalDuration,
    previewUrl,
    recordedBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    resetRecording,
  } = useScreenRecording();

  const { saveClip } = useClipsGallery();
  const { uploadClip, isSyncing } = useCloudClips();

  const [showMicIndicator, setShowMicIndicator] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [autoBackup, setAutoBackup] = useState(() => {
    return localStorage.getItem("nexus-auto-backup") === "true";
  });

  const handleToggleAutoBackup = (checked: boolean) => {
    setAutoBackup(checked);
    localStorage.setItem("nexus-auto-backup", String(checked));
  };

  const handleSaveToGallery = async () => {
    if (recordedBlob) {
      setIsSaving(true);
      try {
        const clip = await saveClip(recordedBlob, finalDuration);
        if (autoBackup && user && clip) {
          await uploadClip(clip);
        }
        resetRecording();
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Card className="glass-card border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Video className="w-5 h-5 text-primary" />
            Screen Recording
          </CardTitle>
          {state === "recording" && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <span className="text-sm font-medium text-destructive">LIVE</span>
            </div>
          )}
          {state === "paused" && (
            <span className="text-sm font-medium text-warning">PAUSED</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview Area */}
        <div className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden border border-border/50">
          {state === "idle" && !previewUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Monitor className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Click record to capture your screen</p>
              <p className="text-xs mt-1 opacity-70">Perfect for streaming highlights & tutorials</p>
            </div>
          )}
          
          {(state === "recording" || state === "paused") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-foreground mb-2">
                  {formatDuration(duration)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {state === "recording" ? "Recording in progress..." : "Recording paused"}
                </p>
              </div>
              
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
                  <Monitor className="w-3 h-3 text-primary" />
                  <span className="text-xs">Screen</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1",
                  showMicIndicator ? "text-primary" : "text-muted-foreground"
                )}>
                  {showMicIndicator ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                  <span className="text-xs">Mic</span>
                </div>
              </div>
            </div>
          )}
          
          {state === "stopped" && previewUrl && (
            <video src={previewUrl} controls className="w-full h-full object-contain" />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {state === "idle" && !previewUrl && (
            <Button onClick={startRecording} variant="gaming" className="gap-2">
              <Circle className="w-4 h-4 fill-current" />
              Start Recording
            </Button>
          )}
          
          {state === "recording" && (
            <>
              <Button onClick={pauseRecording} variant="outline" size="icon" className="w-10 h-10">
                <Pause className="w-4 h-4" />
              </Button>
              <Button onClick={stopRecording} variant="destructive" className="gap-2">
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </Button>
            </>
          )}
          
          {state === "paused" && (
            <>
              <Button onClick={resumeRecording} variant="outline" size="icon" className="w-10 h-10">
                <Play className="w-4 h-4" />
              </Button>
              <Button onClick={stopRecording} variant="destructive" className="gap-2">
                <Square className="w-4 h-4 fill-current" />
                Stop Recording
              </Button>
            </>
          )}
          
          {state === "stopped" && previewUrl && (
            <>
              <Button onClick={handleSaveToGallery} variant="gaming" className="gap-2" disabled={isSaving || isSyncing}>
                <Save className="w-4 h-4" />
                {isSaving ? (isSyncing ? "Backing up..." : "Saving...") : "Save to Gallery"}
              </Button>
              <Button onClick={downloadRecording} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={resetRecording} variant="ghost" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Auto-backup toggle + Tips */}
        <div className="text-xs text-muted-foreground text-center space-y-2">
          {user && (
            <div className="flex items-center justify-center gap-2">
              <CloudUpload className="w-3.5 h-3.5" />
              <Label htmlFor="auto-backup" className="text-xs cursor-pointer">Auto cloud backup</Label>
              <Switch id="auto-backup" checked={autoBackup} onCheckedChange={handleToggleAutoBackup} className="scale-75" />
            </div>
          )}
          <p>💡 Select your screen, window, or tab to record</p>
          {state === "idle" && (
            <p className="opacity-70">Includes system audio + microphone when available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
