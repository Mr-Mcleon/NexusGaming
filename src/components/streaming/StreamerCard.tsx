import { useState, useEffect } from "react";
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
  Settings2,
  Keyboard,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useScreenRecording, formatDuration, QUALITY_PRESETS, QualityPreset, QualitySettings } from "@/hooks/useScreenRecording";
import { useClipsGallery } from "@/hooks/useClipsGallery";
import { useCloudClips } from "@/hooks/useCloudClips";
import { useAuth } from "@/contexts/AuthContext";
import { useWebcam } from "@/hooks/useWebcam";
import { WebcamOverlay, WebcamControls } from "@/components/streaming/WebcamOverlay";
import { useRecordingHotkeys } from "@/hooks/useRecordingHotkeys";


export const StreamerCard = () => {
  const { user } = useAuth();
  const webcam = useWebcam();
  const {
    state,
    countdown,
    duration,
    finalDuration,
    previewUrl,
    recordedBlob,
    quality,
    setQuality,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    resetRecording,
  } = useScreenRecording();

  const { saveClip } = useClipsGallery();
  const { uploadClip, isSyncing } = useCloudClips();

  const handleStartRecording = () => {
    startRecording({
      enabled: webcam.enabled,
      stream: webcam.stream,
      position: webcam.position,
      sizePixels: webcam.sizePixels,
    });
  };
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

  useRecordingHotkeys({
    state,
    hasRecording: !!recordedBlob,
    onStart: handleStartRecording,
    onStop: stopRecording,
    onPause: pauseRecording,
    onResume: resumeRecording,
    onSave: handleSaveToGallery,
    onDownload: downloadRecording,
  });

  const [showHotkeyHint, setShowHotkeyHint] = useState(true);

  useEffect(() => {
    if (showHotkeyHint) {
      const timer = setTimeout(() => setShowHotkeyHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHotkeyHint]);

  return (
    <Card className="glass-card border-primary/20 overflow-hidden relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Video className="w-5 h-5 text-primary" />
            Screen Recording
          </CardTitle>
          <div className="flex items-center gap-2">
            {showHotkeyHint && (
              <Badge
                variant="secondary"
                className="animate-fade-in text-[10px] px-2 py-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                onClick={() => setShowHotkeyHint(false)}
              >
                <Keyboard className="w-3 h-3 mr-1" />
                Ctrl+Shift+? for shortcuts
              </Badge>
            )}
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
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview Area */}
        <div className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden border border-border/50">
          {/* Webcam overlay preview */}
          <WebcamOverlay webcam={webcam} isRecording={state === "recording" || state === "paused" || (state === "idle" && !previewUrl)} />
          
          {state === "idle" && !previewUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Monitor className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Click record to capture your screen</p>
              <p className="text-xs mt-1 opacity-70">Perfect for streaming highlights & tutorials</p>
            </div>
          )}
          
          {state === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <div className="text-center">
                <div className="font-display text-7xl font-bold text-primary animate-pulse">
                  {countdown}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Get ready...</p>
              </div>
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
                {webcam.enabled && (
                  <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-primary">
                    <Camera className="w-3 h-3" />
                    <span className="text-xs">Cam</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {state === "stopped" && previewUrl && (
            <video src={previewUrl} controls className="w-full h-full object-contain" />
          )}
        </div>

        {/* Quality Preset + Controls */}
        <div className="flex items-center justify-center gap-2">
          {state === "idle" && !previewUrl && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Settings2 className="w-3.5 h-3.5" />
                    {quality.preset === "custom" ? "Custom" : quality.preset}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="center">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Quality Preset</Label>
                      <div className="flex gap-1.5">
                        {(Object.keys(QUALITY_PRESETS) as Array<Exclude<QualityPreset, "custom">>).map((preset) => (
                          <Button
                            key={preset}
                            variant={quality.preset === preset ? "default" : "outline"}
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={() => setQuality(QUALITY_PRESETS[preset])}
                          >
                            {preset}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Frame Rate</Label>
                        <span className="text-xs text-muted-foreground">{quality.frameRate} fps</span>
                      </div>
                      <Slider
                        value={[quality.frameRate]}
                        min={15}
                        max={60}
                        step={5}
                        onValueChange={([v]) => setQuality({ ...quality, preset: "custom", frameRate: v })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Bitrate</Label>
                        <span className="text-xs text-muted-foreground">{(quality.videoBitrate / 1_000_000).toFixed(1)} Mbps</span>
                      </div>
                      <Slider
                        value={[quality.videoBitrate / 1_000_000]}
                        min={1}
                        max={50}
                        step={0.5}
                        onValueChange={([v]) => setQuality({ ...quality, preset: "custom", videoBitrate: v * 1_000_000 })}
                      />
                    </div>
                    <Separator />
                    <WebcamControls webcam={webcam} />
                    <div className="text-[10px] text-muted-foreground">
                      Resolution: {quality.width}×{quality.height}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={handleStartRecording} variant="gaming" className="gap-2">
                <Circle className="w-4 h-4 fill-current" />
                Start Recording
              </Button>
            </>
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
          <p className="opacity-50">⌨️ Ctrl+Shift+R to start/stop · Ctrl+Shift+P to pause/resume</p>
        </div>
      </CardContent>
    </Card>
  );
};
