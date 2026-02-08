import { Camera, CameraOff, Move, PictureInPicture2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WebcamPosition, WebcamSize, UseWebcamReturn } from "@/hooks/useWebcam";

const POSITION_CLASSES: Record<WebcamPosition, string> = {
  "bottom-right": "bottom-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "top-right": "top-3 right-3",
  "top-left": "top-3 left-3",
};

const POSITIONS: WebcamPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
const SIZES: WebcamSize[] = ["small", "medium", "large"];

interface WebcamOverlayProps {
  webcam: UseWebcamReturn;
  /** Show within recording preview area */
  isRecording: boolean;
}

export const WebcamOverlay = ({ webcam, isRecording }: WebcamOverlayProps) => {
  if (!webcam.enabled || !isRecording) return null;

  return (
    <div
      className={cn(
        "absolute z-10 rounded-full overflow-hidden border-2 border-primary/60 shadow-lg",
        POSITION_CLASSES[webcam.position]
      )}
      style={{ width: webcam.sizePixels, height: webcam.sizePixels }}
    >
      <video
        ref={webcam.videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
    </div>
  );
};

/** Inline controls shown in the settings popover */
export const WebcamControls = ({ webcam }: { webcam: UseWebcamReturn }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium flex items-center gap-1.5">
          {webcam.enabled ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
          Webcam
        </span>
        <Button
          variant={webcam.enabled ? "default" : "outline"}
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={webcam.toggle}
          disabled={webcam.isLoading}
        >
          {webcam.isLoading ? "..." : webcam.enabled ? "On" : "Off"}
        </Button>
      </div>

      {webcam.enabled && (
        <>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Move className="w-3 h-3" /> Position
            </span>
            <div className="grid grid-cols-2 gap-1">
              {POSITIONS.map((p) => (
                <Button
                  key={p}
                  variant={webcam.position === p ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-[10px] px-1"
                  onClick={() => webcam.setPosition(p)}
                >
                  {p.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Size</span>
            <div className="flex gap-1">
              {SIZES.map((s) => (
                <Button
                  key={s}
                  variant={webcam.size === s ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-6 text-[10px] px-1"
                  onClick={() => webcam.setSize(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <Button
            variant={webcam.isPiP ? "default" : "outline"}
            size="sm"
            className="w-full h-6 text-[10px] gap-1"
            onClick={webcam.togglePiP}
          >
            <PictureInPicture2 className="w-3 h-3" />
            {webcam.isPiP ? "Exit PiP" : "Picture-in-Picture"}
          </Button>
        </>
      )}
    </div>
  );
};
