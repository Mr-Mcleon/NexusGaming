import { useState } from "react";
import { Link2, Plus, RefreshCw, Trash2, Upload, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PLATFORM_LABELS,
  Platform,
  useImportExternalGames,
  useLinkAccount,
  useLinkedAccounts,
  useUnlinkAccount,
  ImportableGame,
} from "@/hooks/useLinkedAccounts";
import { toast } from "sonner";
import { ScanInstalledGamesDialog } from "@/components/settings/ScanInstalledGamesDialog";

const PLATFORMS: Platform[] = ["steam", "xbox", "playstation", "google_play", "other"];

const parseImportInput = (raw: string): ImportableGame[] => {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((g) =>
          typeof g === "string"
            ? { title: g }
            : {
                title: String(g.title ?? g.name ?? "").trim(),
                external_id: g.external_id ?? g.id ?? undefined,
                cover_image_url: g.cover_image_url ?? g.image ?? undefined,
                playtime_minutes:
                  typeof g.playtime_minutes === "number"
                    ? g.playtime_minutes
                    : typeof g.playtime === "number"
                      ? g.playtime
                      : 0,
                installed: Boolean(g.installed),
              },
        )
        .filter((g) => g.title);
    }
  } catch {
    /* not JSON, fall through */
  }
  // Lines: "Title" or "Title, playtime_minutes"
  return trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, mins] = line.split(",").map((p) => p.trim());
      return { title, playtime_minutes: mins ? parseInt(mins, 10) || 0 : 0 };
    })
    .filter((g) => g.title);
};

export const LinkedAccountsSection = () => {
  const { data: accounts = [], isLoading } = useLinkedAccounts();
  const linkAccount = useLinkAccount();
  const unlinkAccount = useUnlinkAccount();
  const importGames = useImportExternalGames();

  const [linkOpen, setLinkOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("steam");
  const [platformUserId, setPlatformUserId] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [importOpenFor, setImportOpenFor] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const importingAccount = accounts.find((a) => a.id === importOpenFor);

  const handleLink = async () => {
    if (!platformUserId.trim() && !displayName.trim()) {
      toast.error("Enter a username or platform ID");
      return;
    }
    await linkAccount.mutateAsync({
      platform,
      platform_user_id: platformUserId.trim() || undefined,
      display_name: displayName.trim() || undefined,
    });
    setPlatformUserId("");
    setDisplayName("");
    setLinkOpen(false);
  };

  const handleImport = async () => {
    if (!importingAccount) return;
    const games = parseImportInput(importText);
    if (!games.length) {
      toast.error("No valid titles found");
      return;
    }
    await importGames.mutateAsync({
      platform: importingAccount.platform,
      linked_account_id: importingAccount.id,
      games,
    });
    setImportText("");
    setImportOpenFor(null);
  };

  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Linked Accounts</h2>
        </div>
        <div className="flex items-center gap-2">
          <ScanInstalledGamesDialog />
        <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="gaming">
              <Plus className="w-4 h-4 mr-1" /> Link Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link an external platform</DialogTitle>
              <DialogDescription>
                Connect a Steam, Xbox, PlayStation, or Google Play account so you can import its games into your unified library.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PLATFORM_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform username or ID</Label>
                <Input
                  value={platformUserId}
                  onChange={(e) => setPlatformUserId(e.target.value)}
                  placeholder="e.g. SteamID64, Gamertag, PSN ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Display name (optional)</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How it shows in your library"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLink} disabled={linkAccount.isPending}>
                {linkAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Auto-detection of installed games requires a desktop client (coming later). For now, link accounts and import titles manually.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No accounts linked yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{PLATFORM_LABELS[acc.platform]}</span>
                  {acc.last_synced_at && (
                    <span className="text-xs text-muted-foreground">
                      synced {new Date(acc.last_synced_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {acc.display_name || acc.platform_user_id || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setImportText("");
                    setImportOpenFor(acc.id);
                  }}
                >
                  <Upload className="w-4 h-4 mr-1" /> Import
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unlink {PLATFORM_LABELS[acc.platform]}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the linked account. Imported games stay in your library unless you delete them separately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => unlinkAccount.mutate(acc.id)}>
                        Unlink
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!importOpenFor} onOpenChange={(o) => !o && setImportOpenFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Import games {importingAccount && `from ${PLATFORM_LABELS[importingAccount.platform]}`}
            </DialogTitle>
            <DialogDescription>
              Paste a JSON array (e.g. <code>[&#123;"title":"Halo","playtime_minutes":120&#125;]</code>) or one title per line. Optional:{" "}
              <code>Title, minutes</code>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder={"Halo Infinite\nForza Horizon 5, 480\n[ { \"title\": \"Sea of Thieves\" } ]"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpenFor(null)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importGames.isPending}>
              {importGames.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" /> Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
