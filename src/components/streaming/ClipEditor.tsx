import { useState, useRef, useEffect, useCallback } from "react";
import {
  Scissors, Save, X, Play, Pause, SkipBack, SkipForward,
  Gauge, RotateCw, FlipHorizontal, FlipVertical, Type,
  Image, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Clip } from "@/hooks/useClipsGallery";
import { formatDuration } from "@/hooks/useScreenRecording";
import { toast } from "sonner";

interface ClipEditorProps {
  clip: Clip | null;
  open: boolean;
  onClose: () => void;
  onSave: (editedBlob: Blob, newDuration: number) => Promise<void>;
}

type ToolTab = "trim" | "speed" | "rotate" | "text" | "background";

interface TextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface EditorSettings {
  trimRange: [number, number];
  speed: number;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  textOverlay: TextOverlay;
  bgColor: string;
  bgBlur: number;
}

const defaultSettings: EditorSettings = {
  trimRange: [0, 100],
  speed: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
  textOverlay: { text: "", x: 50, y: 90, fontSize: 32, color: "#ffffff", fontFamily: "sans-serif" },
  bgColor: "",
  bgBlur: 0,
};

const SPEED_PRESETS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1x", value: 1 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
  { label: "4x", value: 4 },
];

const FONT_OPTIONS = [
  { label: "Sans Serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
  { label: "Cursive", value: "cursive" },
];

const COLOR_PRESETS = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

export const ClipEditor = ({ clip, open, onClose, onSave }: ClipEditorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<ToolTab>("trim");
  const [settings, setSettings] = useState<EditorSettings>({ ...defaultSettings });
  const [isSaving, setIsSaving] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (clip) {
      const url = URL.createObjectURL(clip.blob);
      setVideoUrl(url);
      setSettings({ ...defaultSettings });
      setCurrentTime(0);
      setIsPlaying(false);
      return () => URL.revokeObjectURL(url);
    }
  }, [clip]);

  // Draw preview on canvas
  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const isRotated = settings.rotation === 90 || settings.rotation === 270;
    canvas.width = isRotated ? vh : vw;
    canvas.height = isRotated ? vw : vh;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((settings.rotation * Math.PI) / 180);
    if (settings.flipH) ctx.scale(-1, 1);
    if (settings.flipV) ctx.scale(1, -1);

    // Background
    if (settings.bgColor) {
      ctx.fillStyle = settings.bgColor;
      ctx.fillRect(-vw / 2, -vh / 2, vw, vh);
    }

    ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);

    if (settings.bgBlur > 0) {
      ctx.filter = `blur(${settings.bgBlur}px)`;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
      ctx.globalAlpha = 1;
      ctx.filter = "none";
    }

    ctx.restore();

    // Text overlay (drawn after restore so it's not rotated)
    if (settings.textOverlay.text) {
      const { text, x, y, fontSize, color, fontFamily } = settings.textOverlay;
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Shadow for readability
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(text, (x / 100) * canvas.width, (y / 100) * canvas.height);
      ctx.shadowColor = "transparent";
    }

    if (isPlaying || video.paused) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
    }
  }, [settings]);

  useEffect(() => {
    if (videoUrl) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
      return () => cancelAnimationFrame(animFrameRef.current);
    }
  }, [videoUrl, drawFrame, settings]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      drawFrame();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const endTime = (settings.trimRange[1] / 100) * videoDuration;
      if (current >= endTime) {
        const startTime = (settings.trimRange[0] / 100) * videoDuration;
        videoRef.current.currentTime = startTime;
        if (!isPlaying) videoRef.current.pause();
      }
      setCurrentTime(current);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const startTime = (settings.trimRange[0] / 100) * videoDuration;
        if (videoRef.current.currentTime < startTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.playbackRate = settings.speed;
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = settings.speed;
    }
  }, [settings.speed]);

  const handleRangeChange = (values: number[]) => {
    setSettings((s) => ({ ...s, trimRange: [values[0], values[1]] as [number, number] }));
    if (videoRef.current) {
      videoRef.current.currentTime = (values[0] / 100) * videoDuration;
    }
  };

  const jumpToStart = () => {
    if (videoRef.current) {
      const t = (settings.trimRange[0] / 100) * videoDuration;
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const jumpToEnd = () => {
    if (videoRef.current) {
      const t = (settings.trimRange[1] / 100) * videoDuration - 0.1;
      videoRef.current.currentTime = Math.max(0, t);
      setCurrentTime(t);
    }
  };

  const processAndSave = useCallback(async () => {
    if (!clip) return;
    setIsSaving(true);

    try {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(clip.blob);
      video.muted = true;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      const startTime = (settings.trimRange[0] / 100) * video.duration;
      const endTime = (settings.trimRange[1] / 100) * video.duration;
      const trimmedDuration = (endTime - startTime) / settings.speed;

      video.currentTime = startTime;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      const isRotated = settings.rotation === 90 || settings.rotation === 270;

      const canvas = document.createElement("canvas");
      canvas.width = isRotated ? vh : vw;
      canvas.height = isRotated ? vw : vh;
      const ctx = canvas.getContext("2d")!;

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const blob = await new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
          URL.revokeObjectURL(video.src);
        };

        mediaRecorder.start(100);
        video.playbackRate = settings.speed;
        video.play();

        const render = () => {
          if (video.currentTime >= endTime || video.ended) {
            mediaRecorder.stop();
            video.pause();
            return;
          }

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((settings.rotation * Math.PI) / 180);
          if (settings.flipH) ctx.scale(-1, 1);
          if (settings.flipV) ctx.scale(1, -1);

          if (settings.bgColor) {
            ctx.fillStyle = settings.bgColor;
            ctx.fillRect(-vw / 2, -vh / 2, vw, vh);
          }

          ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
          ctx.restore();

          // Text overlay
          if (settings.textOverlay.text) {
            const { text, x, y, fontSize, color, fontFamily } = settings.textOverlay;
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.7)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(text, (x / 100) * canvas.width, (y / 100) * canvas.height);
            ctx.shadowColor = "transparent";
          }

          requestAnimationFrame(render);
        };
        render();
      });

      await onSave(blob, Math.round(trimmedDuration));
      onClose();
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error("Failed to process video");
    } finally {
      setIsSaving(false);
    }
  }, [clip, settings, onSave, onClose]);

  const hasChanges = settings.trimRange[0] !== 0 || settings.trimRange[1] !== 100 ||
    settings.speed !== 1 || settings.rotation !== 0 || settings.flipH || settings.flipV ||
    settings.textOverlay.text !== "" || settings.bgColor !== "" || settings.bgBlur > 0;

  if (!clip) return null;

  const startTime = (settings.trimRange[0] / 100) * videoDuration;
  const endTime = (settings.trimRange[1] / 100) * videoDuration;
  const trimmedDuration = (endTime - startTime) / settings.speed;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Edit Clip: {clip.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Preview */}
          <div className="space-y-3">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                className="hidden"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={jumpToStart}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button variant="gaming" size="icon" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={jumpToEnd}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                {formatDuration(Math.round(currentTime))} / {formatDuration(Math.round(videoDuration))}
              </span>
            </div>

            {/* Timeline (trim) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDuration(Math.round(startTime))}</span>
                <span className="text-primary font-medium">Output: {formatDuration(Math.round(trimmedDuration))}</span>
                <span>{formatDuration(Math.round(endTime))}</span>
              </div>
              <Slider
                value={settings.trimRange}
                onValueChange={handleRangeChange}
                min={0} max={100} step={0.1}
              />
            </div>
          </div>

          {/* Tool Panel */}
          <div className="space-y-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ToolTab)}>
              <TabsList className="grid grid-cols-5 h-9">
                <TabsTrigger value="trim" className="text-xs px-1"><Scissors className="w-3.5 h-3.5" /></TabsTrigger>
                <TabsTrigger value="speed" className="text-xs px-1"><Gauge className="w-3.5 h-3.5" /></TabsTrigger>
                <TabsTrigger value="rotate" className="text-xs px-1"><RotateCw className="w-3.5 h-3.5" /></TabsTrigger>
                <TabsTrigger value="text" className="text-xs px-1"><Type className="w-3.5 h-3.5" /></TabsTrigger>
                <TabsTrigger value="background" className="text-xs px-1"><Image className="w-3.5 h-3.5" /></TabsTrigger>
              </TabsList>

              {/* Trim */}
              <TabsContent value="trim" className="space-y-3 mt-3">
                <Label className="text-xs font-medium">Trim Range</Label>
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-2">
                  <div className="flex justify-between">
                    <span>Start: {formatDuration(Math.round(startTime))}</span>
                    <span>End: {formatDuration(Math.round(endTime))}</span>
                  </div>
                  <p>💡 Drag the handles on the timeline below to select the portion you want to keep.</p>
                </div>
              </TabsContent>

              {/* Speed */}
              <TabsContent value="speed" className="space-y-3 mt-3">
                <Label className="text-xs font-medium">Playback Speed</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SPEED_PRESETS.map((s) => (
                    <Button
                      key={s.value}
                      variant={settings.speed === s.value ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => setSettings((p) => ({ ...p, speed: s.value }))}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Custom: {settings.speed.toFixed(2)}x</Label>
                  <Slider
                    value={[settings.speed]}
                    onValueChange={([v]) => setSettings((p) => ({ ...p, speed: v }))}
                    min={0.25} max={4} step={0.05}
                  />
                </div>
              </TabsContent>

              {/* Rotate & Flip */}
              <TabsContent value="rotate" className="space-y-3 mt-3">
                <Label className="text-xs font-medium">Rotation</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 90, 180, 270].map((deg) => (
                    <Button
                      key={deg}
                      variant={settings.rotation === deg ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => setSettings((p) => ({ ...p, rotation: deg }))}
                    >
                      {deg}°
                    </Button>
                  ))}
                </div>
                <Label className="text-xs font-medium">Flip</Label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.flipH ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-1 text-xs h-8"
                    onClick={() => setSettings((p) => ({ ...p, flipH: !p.flipH }))}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" /> Horizontal
                  </Button>
                  <Button
                    variant={settings.flipV ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-1 text-xs h-8"
                    onClick={() => setSettings((p) => ({ ...p, flipV: !p.flipV }))}
                  >
                    <FlipVertical className="w-3.5 h-3.5" /> Vertical
                  </Button>
                </div>
              </TabsContent>

              {/* Text Overlay */}
              <TabsContent value="text" className="space-y-3 mt-3">
                <Label className="text-xs font-medium">Text / Watermark</Label>
                <Input
                  placeholder="Enter text..."
                  value={settings.textOverlay.text}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, textOverlay: { ...p.textOverlay, text: e.target.value } }))
                  }
                  className="h-8 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Font</Label>
                    <Select
                      value={settings.textOverlay.fontFamily}
                      onValueChange={(v) =>
                        setSettings((p) => ({ ...p, textOverlay: { ...p.textOverlay, fontFamily: v } }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Size: {settings.textOverlay.fontSize}px</Label>
                    <Slider
                      value={[settings.textOverlay.fontSize]}
                      onValueChange={([v]) =>
                        setSettings((p) => ({ ...p, textOverlay: { ...p.textOverlay, fontSize: v } }))
                      }
                      min={12} max={120} step={1}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Color</Label>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        className={`w-6 h-6 rounded border-2 transition-all ${settings.textOverlay.color === c ? "border-primary scale-110" : "border-border"}`}
                        style={{ backgroundColor: c }}
                        onClick={() =>
                          setSettings((p) => ({ ...p, textOverlay: { ...p.textOverlay, color: c } }))
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Position X: {settings.textOverlay.x}%</Label>
                  <Slider
                    value={[settings.textOverlay.x]}
                    onValueChange={([v]) =>
                      setSettings((p) => ({ ...p, textOverlay: { ...p.textOverlay, x: v } }))
                    }
                    min={0} max={100} step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Position Y: {settings.textOverlay.y}%</Label>
                  <Slider
                    value={[settings.textOverlay.y]}
                    onValueChange={([v]) =>
                      setSettings((p) => ({ ...p, textOverlay: { ...p.textOverlay, y: v } }))
                    }
                    min={0} max={100} step={1}
                  />
                </div>
              </TabsContent>

              {/* Background */}
              <TabsContent value="background" className="space-y-3 mt-3">
                <Label className="text-xs font-medium">Background Color</Label>
                <div className="flex gap-1 flex-wrap">
                  <button
                    className={`w-6 h-6 rounded border-2 transition-all ${!settings.bgColor ? "border-primary scale-110" : "border-border"}`}
                    style={{ background: "repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px" }}
                    onClick={() => setSettings((p) => ({ ...p, bgColor: "" }))}
                    title="None"
                  />
                  {["#000000", "#ffffff", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"].map((c) => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded border-2 transition-all ${settings.bgColor === c ? "border-primary scale-110" : "border-border"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSettings((p) => ({ ...p, bgColor: c }))}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Blur Intensity: {settings.bgBlur}</Label>
                  <Slider
                    value={[settings.bgBlur]}
                    onValueChange={([v]) => setSettings((p) => ({ ...p, bgBlur: v }))}
                    min={0} max={20} step={1}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Reset */}
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSettings({ ...defaultSettings })}
              >
                Reset All Changes
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button variant="gaming" onClick={processAndSave} disabled={isSaving || !hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Processing..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
