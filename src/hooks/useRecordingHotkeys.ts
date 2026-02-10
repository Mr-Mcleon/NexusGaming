import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { RecordingState } from "@/hooks/useScreenRecording";

interface UseRecordingHotkeysOptions {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export const useRecordingHotkeys = ({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
}: UseRecordingHotkeysOptions) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Ctrl+Shift+R — Start / Stop toggle
      if (ctrl && shift && e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (state === "idle" || state === "stopped") {
          onStart();
        } else if (state === "recording" || state === "paused") {
          onStop();
        }
        return;
      }

      // Ctrl+Shift+P — Pause / Resume toggle
      if (ctrl && shift && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (state === "recording") {
          onPause();
        } else if (state === "paused") {
          onResume();
        }
        return;
      }
    },
    [state, onStart, onStop, onPause, onResume]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
