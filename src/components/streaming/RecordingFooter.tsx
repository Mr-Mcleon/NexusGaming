import { CloudUpload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { RecordingState } from "@/hooks/useScreenRecording";

interface RecordingFooterProps {
  state: RecordingState;
  isLoggedIn: boolean;
  autoBackup: boolean;
  onToggleAutoBackup: (checked: boolean) => void;
}

export const RecordingFooter = ({
  state,
  isLoggedIn,
  autoBackup,
  onToggleAutoBackup,
}: RecordingFooterProps) => {
  return (
    <div className="text-xs text-muted-foreground text-center space-y-2">
      {isLoggedIn && (
        <div className="flex items-center justify-center gap-2">
          <CloudUpload className="w-3.5 h-3.5" />
          <Label htmlFor="auto-backup" className="text-xs cursor-pointer">
            Auto cloud backup
          </Label>
          <Switch
            id="auto-backup"
            checked={autoBackup}
            onCheckedChange={onToggleAutoBackup}
            className="scale-75"
          />
        </div>
      )}
      <p>💡 Select your screen, window, or tab to record</p>
      {state === "idle" && (
        <p className="opacity-70">Includes system audio + microphone when available</p>
      )}
      <p className="opacity-50">⌨️ Ctrl+Shift+R to start/stop · Ctrl+Shift+P to pause/resume</p>
    </div>
  );
};
