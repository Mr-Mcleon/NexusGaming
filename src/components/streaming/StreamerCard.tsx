import { useState, useEffect } from "react";
import { Video, Keyboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScreenRecording } from "@/hooks/useScreenRecording";
import { useClipsGallery } from "@/hooks/useClipsGallery";
import { useCloudClips } from "@/hooks/useCloudClips";
import { useAuth } from "@/contexts/AuthContext";
import { useWebcam } from "@/hooks/useWebcam";
import { useRecordingHotkeys } from "@/hooks/useRecordingHotkeys";
import { RecordingPreview } from "@/components/streaming/RecordingPreview";
import { RecordingControls } from "@/components/streaming/RecordingControls";
import { RecordingFooter } from "@/components/streaming/RecordingFooter";

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

  const [showMicIndicator] = useState(true);
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
        <RecordingPreview
          state={state}
          countdown={countdown}
          duration={duration}
          previewUrl={previewUrl}
          webcam={webcam}
          showMicIndicator={showMicIndicator}
        />

        <RecordingControls
          state={state}
          previewUrl={previewUrl}
          quality={quality}
          setQuality={setQuality}
          webcam={webcam}
          isSaving={isSaving}
          isSyncing={isSyncing}
          onStart={handleStartRecording}
          onStop={stopRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onSave={handleSaveToGallery}
          onDownload={downloadRecording}
          onReset={resetRecording}
        />

        <RecordingFooter
          state={state}
          isLoggedIn={!!user}
          autoBackup={autoBackup}
          onToggleAutoBackup={handleToggleAutoBackup}
        />
      </CardContent>
    </Card>
  );
};
