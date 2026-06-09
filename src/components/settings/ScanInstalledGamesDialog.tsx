import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HardDriveDownload, FolderSearch, Loader2, AlertTriangle } from "lucide-react";
import {
  isFileSystemAccessSupported,
  pickAndScan,
  groupByPlatform,
  type ScanKind,
  type ScannedGame,
} from "@/lib/installedGameScanner";
import {
  PLATFORM_LABELS,
  Platform,
  useImportExternalGames,
  useLinkedAccounts,
} from "@/hooks/useLinkedAccounts";
import { toast } from "sonner";

const SCAN_OPTIONS: { kind: ScanKind; label: string; hint: string }[] = [
  { kind: "steam", label: "Steam library", hint: "Pick your steamapps/ folder (or its parent)" },
  { kind: "epic", label: "Epic Games", hint: "Pick the EpicGamesLauncher Manifests folder" },
  { kind: "gog", label: "GOG Galaxy", hint: "Pick your GOG Games folder" },
  { kind: "generic", label: "Generic folder", hint: "Each subfolder is treated as a game" },
];

export const ScanInstalledGamesDialog = () => {
  const supported = isFileSystemAccessSupported();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ScanKind>("steam");
  const [genericPlatform, setGenericPlatform] = useState<Platform>("other");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScannedGame[]>([]);
  const { data: accounts = [] } = useLinkedAccounts();
  const importGames = useImportExternalGames();

  const handleScan = async () => {
    setScanning(true);
    try {
      const found = await pickAndScan(kind, genericPlatform);
      setResults(found);
      if (!found.length) toast.info("No installed games detected in that folder");
      else toast.success(`Found ${found.length} game${found.length === 1 ? "" : "s"}`);
    } catch (e) {
      const err = e as Error;
      if (err.name !== "AbortError") toast.error(err.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleImport = async () => {
    if (!results.length) return;
    const grouped = groupByPlatform(results);
    let total = 0;
    for (const [platform, games] of Object.entries(grouped) as [Platform, ScannedGame[]][]) {
      const linked = accounts.find((a) => a.platform === platform);
      await importGames.mutateAsync({
        platform,
        linked_account_id: linked?.id ?? null,
        games,
      });
      total += games.length;
    }
    toast.success(`Imported ${total} detected game${total === 1 ? "" : "s"} into your library`);
    setResults([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <HardDriveDownload className="w-4 h-4 mr-1" /> Scan installed
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan installed games</DialogTitle>
          <DialogDescription>
            Pick a launcher library folder on this device. Detected titles are added to your External tab.
          </DialogDescription>
        </DialogHeader>

        {!supported && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive" />
            <p>
              Folder scanning needs a Chromium-based desktop browser (Chrome, Edge, Brave, Arc). On mobile or Safari, use manual import instead.
            </p>
          </div>
        )}

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ScanKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCAN_OPTIONS.map((o) => (
                  <SelectItem key={o.kind} value={o.kind}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {SCAN_OPTIONS.find((o) => o.kind === kind)?.hint}
            </p>
          </div>

          {kind === "generic" && (
            <div className="space-y-2">
              <Label>Tag as platform</Label>
              <Select value={genericPlatform} onValueChange={(v) => setGenericPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["steam", "xbox", "playstation", "google_play", "other"] as Platform[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLATFORM_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleScan} disabled={!supported || scanning} className="w-full">
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FolderSearch className="w-4 h-4 mr-1" /> Pick folder & scan
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Detected ({results.length})</Label>
                <Badge variant="secondary">{kind}</Badge>
              </div>
              <ScrollArea className="h-48 rounded-md border p-2">
                <ul className="space-y-1 text-sm">
                  {results.map((g, i) => (
                    <li key={`${g.external_id ?? g.title}-${i}`} className="flex justify-between gap-2">
                      <span className="truncate">{g.title}</span>
                      <span className="text-xs text-muted-foreground">{PLATFORM_LABELS[g.platform]}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!results.length || importGames.isPending}
          >
            {importGames.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `Import ${results.length || ""}`.trim()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
