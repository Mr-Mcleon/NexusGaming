import { useState, useRef, useCallback, useEffect } from "react";

export type WebcamPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export type WebcamSize = "small" | "medium" | "large";

const SIZE_MAP: Record<WebcamSize, number> = {
  small: 120,
  medium: 180,
  large: 260,
};

export interface UseWebcamReturn {
  enabled: boolean;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  position: WebcamPosition;
  size: WebcamSize;
  sizePixels: number;
  isLoading: boolean;
  isPiP: boolean;
  toggle: () => Promise<void>;
  togglePiP: () => Promise<void>;
  setPosition: (p: WebcamPosition) => void;
  setSize: (s: WebcamSize) => void;
  stop: () => void;
}

export const useWebcam = (): UseWebcamReturn => {
  const [enabled, setEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [position, setPosition] = useState<WebcamPosition>(() => {
    return (localStorage.getItem("nexus-webcam-position") as WebcamPosition) || "bottom-right";
  });
  const [size, setSize] = useState<WebcamSize>(() => {
    return (localStorage.getItem("nexus-webcam-size") as WebcamSize) || "medium";
  });
  const videoRef = useRef<HTMLVideoElement>(null!);

  const handleSetPosition = useCallback((p: WebcamPosition) => {
    setPosition(p);
    localStorage.setItem("nexus-webcam-position", p);
  }, []);

  const handleSetSize = useCallback((s: WebcamSize) => {
    setSize(s);
    localStorage.setItem("nexus-webcam-size", s);
  }, []);

  const startWebcam = useCallback(async () => {
    setIsLoading(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false, // audio handled separately
      });
      setStream(s);
      setEnabled(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    } catch {
      // permission denied or no camera
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exitPiP = useCallback(async () => {
    if (document.pictureInPictureElement) {
      try { await document.exitPictureInPicture(); } catch { /* ignore */ }
    }
    setIsPiP(false);
  }, []);

  const stop = useCallback(() => {
    exitPiP();
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setEnabled(false);
  }, [stream, exitPiP]);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current || !enabled) return;
    if (document.pictureInPictureElement) {
      await exitPiP();
    } else {
      try {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      } catch {
        // PiP not supported or denied
      }
    }
  }, [enabled, exitPiP]);

  const toggle = useCallback(async () => {
    if (enabled) {
      stop();
    } else {
      await startWebcam();
    }
  }, [enabled, stop, startWebcam]);

  // Sync video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for PiP exit via browser controls
  useEffect(() => {
    const handler = () => setIsPiP(false);
    videoRef.current?.addEventListener("leavepictureinpicture", handler);
    return () => videoRef.current?.removeEventListener("leavepictureinpicture", handler);
  }, [enabled]);

  return {
    enabled,
    stream,
    videoRef,
    position,
    size,
    sizePixels: SIZE_MAP[size],
    isLoading,
    isPiP,
    toggle,
    togglePiP,
    setPosition: handleSetPosition,
    setSize: handleSetSize,
    stop,
  };
};
