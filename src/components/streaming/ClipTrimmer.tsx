import { useState, useRef, useEffect, useCallback } from "react";
import { Scissors, Save, X, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clip } from "@/hooks/useClipsGallery";
import { formatDuration } from "@/hooks/useScreenRecording";
import { toast } from "sonner";

interface ClipTrimmerProps {
  clip: Clip | null;
  open: boolean;
  onClose: () => void;
  onSave: (trimmedBlob: Blob, newDuration: number) => Promise<void>;
}

export const ClipTrimmer = ({ clip, open, onClose, onSave }: ClipTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when clip changes
  useEffect(() => {
    if (clip) {
      setTrimRange([0, 100]);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [clip]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const endTime = (trimRange[1] / 100) * videoDuration;
      
      // If current time exceeds trim end, loop back to trim start
      if (current >= endTime) {
        const startTime = (trimRange[0] / 100) * videoDuration;
        videoRef.current.currentTime = startTime;
        if (!isPlaying) {
          videoRef.current.pause();
        }
      }
      setCurrentTime(current);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Start from trim start if at beginning
        const startTime = (trimRange[0] / 100) * videoDuration;
        if (videoRef.current.currentTime < startTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRangeChange = (values: number[]) => {
    setTrimRange([values[0], values[1]]);
    if (videoRef.current) {
      const newTime = (values[0] / 100) * videoDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const jumpToStart = () => {
    if (videoRef.current) {
      const startTime = (trimRange[0] / 100) * videoDuration;
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const jumpToEnd = () => {
    if (videoRef.current) {
      const endTime = (trimRange[1] / 100) * videoDuration - 0.1;
      videoRef.current.currentTime = Math.max(0, endTime);
      setCurrentTime(endTime);
    }
  };

  const getTimeFromPercent = (percent: number): number => {
    return (percent / 100) * videoDuration;
  };

  const trimVideo = useCallback(async (): Promise<{ blob: Blob; duration: number } | null> => {
    if (!clip || !videoRef.current) return null;

    const startTime = getTimeFromPercent(trimRange[0]);
    const endTime = getTimeFromPercent(trimRange[1]);
    const trimmedDuration = endTime - startTime;

    // For WebM, we'll use MediaRecorder to re-record the trimmed section
    const video = document.createElement("video");
    video.src = URL.createObjectURL(clip.blob);
    video.muted = true;

    return new Promise((resolve) => {
      video.onloadedmetadata = async () => {
        video.currentTime = startTime;
        
        video.onseeked = async () => {
          // Create a canvas to capture video frames
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(null);
            return;
          }

          // Create a MediaStream from canvas
          const stream = canvas.captureStream(30);

          // Try to get audio from the original video
          try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(video);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            source.connect(audioContext.destination);
            
            destination.stream.getAudioTracks().forEach(track => {
              stream.addTrack(track);
            });
          } catch (e) {
            // No audio or audio error, continue without audio
          }

          const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
            : "video/webm";

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 8000000,
          });

          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            URL.revokeObjectURL(video.src);
            resolve({ blob, duration: Math.round(trimmedDuration) });
          };

          // Start recording
          mediaRecorder.start(100);
          video.play();

          // Draw frames to canvas
          const drawFrame = () => {
            if (video.currentTime >= endTime || video.ended) {
              mediaRecorder.stop();
              video.pause();
              return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          };

          drawFrame();
        };
      };
    });
  }, [clip, trimRange]);

  const handleSave = async () => {
    if (!clip) return;

    // Check if trim is actually different
    if (trimRange[0] === 0 && trimRange[1] === 100) {
      toast.info("No changes to save - select a trim range first");
      return;
    }

    setIsSaving(true);
    try {
      const result = await trimVideo();
      if (result) {
        await onSave(result.blob, result.duration);
        onClose();
      } else {
        toast.error("Failed to trim video");
      }
    } catch (error) {
      console.error("Error trimming video:", error);
      toast.error("Failed to trim video");
    } finally {
      setIsSaving(false);
    }
  };

  if (!clip) return null;

  const startTime = getTimeFromPercent(trimRange[0]);
  const endTime = getTimeFromPercent(trimRange[1]);
  const trimmedDuration = endTime - startTime;
  const currentPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Trim Clip: {clip.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={URL.createObjectURL(clip.blob)}
              className="w-full h-full object-contain"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Playback Controls */}
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
          </div>

          {/* Trim Range Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trim Range</span>
              <span className="font-medium">
                {formatDuration(Math.round(startTime))} - {formatDuration(Math.round(endTime))}
              </span>
            </div>
            
            <div className="relative pt-2">
              {/* Current time indicator */}
              <div 
                className="absolute top-0 w-0.5 h-2 bg-primary z-10"
                style={{ left: `${currentPercent}%` }}
              />
              
              <Slider
                value={trimRange}
                onValueChange={handleRangeChange}
                min={0}
                max={100}
                step={0.1}
                className="relative"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0:00</span>
              <span className="text-primary font-medium">
                New duration: {formatDuration(Math.round(trimmedDuration))}
              </span>
              <span>{formatDuration(Math.round(videoDuration))}</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              💡 Drag the handles to select the portion you want to keep. 
              The trimmed clip will replace the original.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="gaming" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Trimmed Clip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
