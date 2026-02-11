import {
  Circle,
  Square,
  Pause,
  Play,
  Download,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QUALITY_PRESETS, QualityPreset, QualitySettings } from "@/hooks/useScreenRecording";
import type { RecordingState } from "@/hooks/useScreenRecording";
import { WebcamControls } from "@/components/streaming/WebcamOverlay";
import type { useWebcam } from "@/hooks/useWebcam";

interface RecordingControlsProps {
  state: RecordingState;
  previewUrl: string | null;
  quality: QualitySettings;
  setQuality: (q: QualitySettings) => void;
  webcam: ReturnType<typeof useWebcam>;
  isSaving: boolean;
  isSyncing: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onSave: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export const RecordingControls = ({
  state,
  previewUrl,
  quality,
  setQuality,
  webcam,
  isSaving,
  isSyncing,
  onStart,
  onStop,
  onPause,
  onResume,
  onSave,
  onDownload,
  onReset,
}: RecordingControlsProps) => {
  return (
    <TooltipProvider delayDuration={300}>
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
                      {(Object.keys(QUALITY_PRESETS) as Array<Exclude<QualityPreset, "custom">>).map(
                        (preset) => (
                          <Button
                            key={preset}
                            variant={quality.preset === preset ? "default" : "outline"}
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={() => setQuality(QUALITY_PRESETS[preset])}
                          >
                            {preset}
                          </Button>
                        )
                      )}
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
                      onValueChange={([v]) =>
                        setQuality({ ...quality, preset: "custom", frameRate: v })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Bitrate</Label>
                      <span className="text-xs text-muted-foreground">
                        {(quality.videoBitrate / 1_000_000).toFixed(1)} Mbps
                      </span>
                    </div>
                    <Slider
                      value={[quality.videoBitrate / 1_000_000]}
                      min={1}
                      max={50}
                      step={0.5}
                      onValueChange={([v]) =>
                        setQuality({ ...quality, preset: "custom", videoBitrate: v * 1_000_000 })
                      }
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onStart} variant="gaming" className="gap-2">
                  <Circle className="w-4 h-4 fill-current" />
                  Start Recording
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="font-mono text-[10px]">Ctrl+Shift+R</kbd>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {state === "recording" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onPause} variant="outline" size="icon" className="w-10 h-10">
                  <Pause className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="font-mono text-[10px]">Ctrl+Shift+P</kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onStop} variant="destructive" className="gap-2">
                  <Square className="w-4 h-4 fill-current" />
                  Stop Recording
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="font-mono text-[10px]">Ctrl+Shift+R</kbd>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {state === "paused" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onResume} variant="outline" size="icon" className="w-10 h-10">
                  <Play className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="font-mono text-[10px]">Ctrl+Shift+P</kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onStop} variant="destructive" className="gap-2">
                  <Square className="w-4 h-4 fill-current" />
                  Stop Recording
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="font-mono text-[10px]">Ctrl+Shift+R</kbd>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {state === "stopped" && previewUrl && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onSave}
                  variant="gaming"
                  className="gap-2"
                  disabled={isSaving || isSyncing}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? (isSyncing ? "Backing up..." : "Saving...") : "Save to Gallery"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="font-mono text-[10px]">Ctrl+Shift+S</kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onDownload} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <kbd className="font-mono text-[10px]">Ctrl+Shift+D</kbd>
              </TooltipContent>
            </Tooltip>
            <Button onClick={onReset} variant="ghost" size="icon">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
