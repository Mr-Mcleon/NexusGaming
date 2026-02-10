import { useEffect, useCallback } from "react";
import type { RecordingState } from "@/hooks/useScreenRecording";

interface UseRecordingHotkeysOptions {
  state: RecordingState;
  hasRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onSave: () => void;
  onDownload: () => void;
}

export const useRecordingHotkeys = ({
  state,
  hasRecording,
  onStart,
  onStop,
  onPause,
  onResume,
  onSave,
  onDownload,
}: UseRecordingHotkeysOptions) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (!ctrl || !shift) return;

      const key = e.key.toLowerCase();

      // Ctrl+Shift+R — Start / Stop toggle
      if (key === "r") {
        e.preventDefault();
        if (state === "idle" || state === "stopped") onStart();
        else if (state === "recording" || state === "paused") onStop();
        return;
      }

      // Ctrl+Shift+P — Pause / Resume toggle
      if (key === "p") {
        e.preventDefault();
        if (state === "recording") onPause();
        else if (state === "paused") onResume();
        return;
      }

      // Ctrl+Shift+S — Save to gallery
      if (key === "s") {
        e.preventDefault();
        if (state === "stopped" && hasRecording) onSave();
        return;
      }

      // Ctrl+Shift+D — Download recording
      if (key === "d") {
        e.preventDefault();
        if (state === "stopped" && hasRecording) onDownload();
        return;
      }
    },
    [state, hasRecording, onStart, onStop, onPause, onResume, onSave, onDownload]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
