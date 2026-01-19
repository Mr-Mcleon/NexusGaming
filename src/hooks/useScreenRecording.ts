import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

interface UseScreenRecordingReturn {
  state: RecordingState;
  duration: number;
  recordedBlob: Blob | null;
  previewUrl: string | null;
  finalDuration: number;
  startRecording: () => Promise<void>;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const startRecording = useCallback(async () => {
    try {
      // Request screen capture with audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 60, max: 60 },
        },
        audio: true,
      });

      // Try to capture microphone audio as well
      let combinedStream = displayStream;
      
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        // Combine display and microphone audio tracks
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        // Add display audio if available
        const displayAudioTracks = displayStream.getAudioTracks();
        if (displayAudioTracks.length > 0) {
          const displayAudioSource = audioContext.createMediaStreamSource(
            new MediaStream(displayAudioTracks)
          );
          displayAudioSource.connect(destination);
        }

        // Add microphone audio
        const micAudioSource = audioContext.createMediaStreamSource(audioStream);
        micAudioSource.connect(destination);

        // Create combined stream
        combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...destination.stream.getAudioTracks(),
        ]);
      } catch (audioError) {
        console.log("Microphone access denied, recording without mic audio");
      }

      streamRef.current = combinedStream;
      chunksRef.current = [];

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setFinalDuration(duration);
        
        // Clean up previous preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setState("stopped");
        stopTimer();
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      // Handle user stopping screen share via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Capture in 1-second chunks
      
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
  }, [previewUrl, startTimer, stopTimer]);

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
