import { Monitor, Mic, MicOff, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/hooks/useScreenRecording";
import type { RecordingState } from "@/hooks/useScreenRecording";
import { WebcamOverlay } from "@/components/streaming/WebcamOverlay";
import type { useWebcam } from "@/hooks/useWebcam";

interface RecordingPreviewProps {
  state: RecordingState;
  countdown: number;
  duration: number;
  previewUrl: string | null;
  webcam: ReturnType<typeof useWebcam>;
  showMicIndicator: boolean;
}

export const RecordingPreview = ({
  state,
  countdown,
  duration,
  previewUrl,
  webcam,
  showMicIndicator,
}: RecordingPreviewProps) => {
  return (
    <div className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden border border-border/50">
      <WebcamOverlay
        webcam={webcam}
        isRecording={state === "recording" || state === "paused" || (state === "idle" && !previewUrl)}
      />

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
            <div
              className={cn(
                "flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1",
                showMicIndicator ? "text-primary" : "text-muted-foreground"
              )}
            >
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
  );
};
