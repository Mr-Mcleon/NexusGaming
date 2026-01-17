import { Cloud, CloudOff, RefreshCw, Download, Upload, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAccountSync } from "@/hooks/useAccountSync";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export const AccountSyncSection = () => {
  const { user } = useAuth();
  const {
    syncEnabled,
    setSyncEnabled,
    lastSyncedAt,
    syncToCloud,
    pullFromCloud,
    isSyncing,
    isPulling,
    isLoading,
  } = useAccountSync();

  if (!user) {
    return (
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CloudOff className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Account Sync</h2>
        </div>
        <div className="text-center py-6">
          <Cloud className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Sign in to sync your settings across all your devices
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-muted-foreground" />
        <h2 className="font-medium">Account Sync</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Keep your theme, notification preferences, and settings synchronized across all your devices.
      </p>

      {/* Sync Toggle */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          {syncEnabled ? (
            <Cloud className="w-5 h-5 text-primary" />
          ) : (
            <CloudOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="sync-toggle" className="cursor-pointer font-medium">
              Cloud Sync
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically sync settings across devices
            </p>
          </div>
        </div>
        <Switch
          id="sync-toggle"
          checked={syncEnabled}
          onCheckedChange={setSyncEnabled}
        />
      </div>

      {/* Sync Status */}
      {syncEnabled && (
        <>
          <div className="flex items-center gap-2 mb-4">
            {lastSyncedAt ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Last synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
                </span>
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking sync status...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No sync data found</span>
              </>
            )}
          </div>

          {/* Sync Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={syncToCloud}
              disabled={isSyncing || isPulling}
              className="flex-1"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Push to Cloud
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pullFromCloud}
              disabled={isSyncing || isPulling || !lastSyncedAt}
              className="flex-1"
            >
              {isPulling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Pull from Cloud
            </Button>
          </div>

          {/* Synced Items Info */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Synced settings include:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Theme preference
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Sound notification settings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Desktop notification settings
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
