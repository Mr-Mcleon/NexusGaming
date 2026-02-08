import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

export type QualityPreset = "720p" | "1080p" | "4k" | "custom";

export interface QualitySettings {
  preset: QualityPreset;
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number; // in bps
}

export const QUALITY_PRESETS: Record<Exclude<QualityPreset, "custom">, QualitySettings> = {
  "720p": { preset: "720p", width: 1280, height: 720, frameRate: 30, videoBitrate: 2_500_000 },
  "1080p": { preset: "1080p", width: 1920, height: 1080, frameRate: 60, videoBitrate: 8_000_000 },
  "4k": { preset: "4k", width: 3840, height: 2160, frameRate: 60, videoBitrate: 35_000_000 },
};

export interface WebcamCompositeOptions {
  enabled: boolean;
  stream: MediaStream | null;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  sizePixels: number;
}

interface UseScreenRecordingReturn {
  state: RecordingState;
  duration: number;
  recordedBlob: Blob | null;
  previewUrl: string | null;
  finalDuration: number;
  quality: QualitySettings;
  setQuality: (q: QualitySettings) => void;
  startRecording: (webcam?: WebcamCompositeOptions) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  downloadRecording: () => void;
  resetRecording: () => void;
}

export const useScreenRecording = (): UseScreenRecordingReturn => {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualitySettings>(() => {
    const saved = localStorage.getItem("nexus-recording-quality");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return QUALITY_PRESETS["1080p"];
  });

  const handleSetQuality = useCallback((q: QualitySettings) => {
    setQuality(q);
    localStorage.setItem("nexus-recording-quality", JSON.stringify(q));
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopCompositing = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    canvasRef.current = null;
  }, []);

  const startRecording = useCallback(async (webcam?: WebcamCompositeOptions) => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          width: { ideal: quality.width },
          height: { ideal: quality.height },
          frameRate: { ideal: quality.frameRate, max: quality.frameRate },
        },
        audio: true,
      });

      // Try to capture microphone audio as well
      let audioTracks: MediaStreamTrack[] = [...displayStream.getAudioTracks()];

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        const displayAudioTracks = displayStream.getAudioTracks();
        if (displayAudioTracks.length > 0) {
          const src = audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks));
          src.connect(destination);
        }
        const micSrc = audioContext.createMediaStreamSource(audioStream);
        micSrc.connect(destination);
        audioTracks = [...destination.stream.getAudioTracks()];
      } catch {
        console.log("Microphone access denied, recording without mic audio");
      }

      // Determine if we need canvas compositing (webcam enabled)
      let recordStream: MediaStream;

      if (webcam?.enabled && webcam.stream) {
        // Set up canvas-based compositing
        const canvas = document.createElement("canvas");
        canvas.width = quality.width;
        canvas.height = quality.height;
        canvasRef.current = canvas;
        const ctx = canvas.getContext("2d")!;

        const screenVideo = document.createElement("video");
        screenVideo.srcObject = displayStream;
        screenVideo.muted = true;
        screenVideo.play();

        const camVideo = document.createElement("video");
        camVideo.srcObject = webcam.stream;
        camVideo.muted = true;
        camVideo.play();

        const drawFrame = () => {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

          // Draw circular webcam overlay
          const camSize = webcam.sizePixels * (canvas.width / 1920); // scale relative
          const padding = 20;
          let x: number, y: number;
          switch (webcam.position) {
            case "top-left":
              x = padding; y = padding; break;
            case "top-right":
              x = canvas.width - camSize - padding; y = padding; break;
            case "bottom-left":
              x = padding; y = canvas.height - camSize - padding; break;
            default: // bottom-right
              x = canvas.width - camSize - padding; y = canvas.height - camSize - padding;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(x + camSize / 2, y + camSize / 2, camSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          // Mirror the webcam horizontally
          ctx.translate(x + camSize, y);
          ctx.scale(-1, 1);
          ctx.drawImage(camVideo, 0, 0, camSize, camSize);
          ctx.restore();

          // Draw border
          ctx.beginPath();
          ctx.arc(x + camSize / 2, y + camSize / 2, camSize / 2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
          ctx.lineWidth = 3;
          ctx.stroke();

          animFrameRef.current = requestAnimationFrame(drawFrame);
        };
        drawFrame();

        const canvasStream = canvas.captureStream(quality.frameRate);
        recordStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioTracks,
        ]);
      } else {
        recordStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...audioTracks,
        ]);
      }

      streamRef.current = recordStream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(recordStream, {
        mimeType,
        videoBitsPerSecond: quality.videoBitrate,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setFinalDuration(duration);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setState("stopped");
        stopTimer();
        stopCompositing();
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        displayStream.getTracks().forEach((t) => t.stop());
      };

      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === "recording") stopRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setState("recording");
      setDuration(0);
      startTimer();
      toast.success("Recording started!");
    } catch (error) {
      console.error("Error starting recording:", error);
      if ((error as Error).name === "NotAllowedError") {
        toast.error("Screen sharing permission denied");
      } else {
        toast.error("Failed to start recording");
      }
    }
  }, [previewUrl, startTimer, stopTimer, stopCompositing, quality]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      toast.success("Recording saved!");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
      stopTimer();
      toast.info("Recording paused");
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      startTimer();
      toast.info("Recording resumed");
    }
  }, [startTimer]);

  const downloadRecording = useCallback(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Recording downloaded!");
    }
  }, [recordedBlob]);

  const resetRecording = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    setFinalDuration(0);
    setState("idle");
    chunksRef.current = [];
  }, [previewUrl]);

  return {
    state,
    duration,
    finalDuration,
    recordedBlob,
    previewUrl,
    quality,
    setQuality: handleSetQuality,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    resetRecording,
  };
};

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
