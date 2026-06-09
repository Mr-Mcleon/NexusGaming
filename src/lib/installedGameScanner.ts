// Browser-side installed-game scanner using the File System Access API.
// Works in Chromium-based desktop browsers. Lets users pick library folders
// (Steam, Epic, GOG, generic) and parses local manifests to detect installed
// games. No filesystem watching; user-initiated only.

import type { Platform } from "@/hooks/useLinkedAccounts";

export interface ScannedGame {
  title: string;
  external_id?: string;
  platform: Platform;
  playtime_minutes?: number;
  installed: boolean;
  cover_image_url?: string;
}

export const isFileSystemAccessSupported = () =>
  typeof window !== "undefined" && "showDirectoryPicker" in window;

// ---- Steam: appmanifest_<appid>.acf in steamapps/ ----
const parseAcf = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const re = /"([^"]+)"\s+"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out[m[1].toLowerCase()] = m[2];
  return out;
};

async function scanSteamDir(dir: FileSystemDirectoryHandle): Promise<ScannedGame[]> {
  const games: ScannedGame[] = [];
  // Accept either steamapps/ itself or a parent that contains steamapps/
  let steamapps: FileSystemDirectoryHandle = dir;
  try {
    steamapps = await dir.getDirectoryHandle("steamapps");
  } catch {
    // assume `dir` is already steamapps
  }
  // @ts-ignore
  for await (const [name, handle] of steamapps.entries()) {
    if (
      handle.kind === "file" &&
      name.startsWith("appmanifest_") &&
      name.endsWith(".acf")
    ) {
      try {
        const file = await (handle as FileSystemFileHandle).getFile();
        const text = await file.text();
        const fields = parseAcf(text);
        const appid = fields.appid;
        const title = fields.name;
        if (!title) continue;
        games.push({
          title,
          external_id: appid ? `steam:${appid}` : undefined,
          platform: "steam",
          installed: true,
        });
      } catch {
        /* ignore unreadable manifest */
      }
    }
  }
  return games;
}

// ---- Epic: <ProgramData>/Epic/EpicGamesLauncher/Data/Manifests/*.item ----
async function scanEpicDir(dir: FileSystemDirectoryHandle): Promise<ScannedGame[]> {
  const games: ScannedGame[] = [];
  let manifests: FileSystemDirectoryHandle = dir;
  // Try descending into common subpaths
  for (const sub of ["Manifests", "Data/Manifests", "EpicGamesLauncher/Data/Manifests"]) {
    try {
      let cur = dir;
      for (const part of sub.split("/")) cur = await cur.getDirectoryHandle(part);
      manifests = cur;
      break;
    } catch {
      /* try next */
    }
  }
  // @ts-ignore
  for await (const [name, handle] of manifests.entries()) {
    if (handle.kind !== "file" || !name.endsWith(".item")) continue;
    try {
      const file = await (handle as FileSystemFileHandle).getFile();
      const json = JSON.parse(await file.text());
      const title = json.DisplayName || json.AppName;
      if (!title) continue;
      games.push({
        title,
        external_id: json.CatalogItemId ? `epic:${json.CatalogItemId}` : `epic:${name}`,
        platform: "other",
        installed: true,
      });
    } catch {
      /* ignore */
    }
  }
  return games;
}

// ---- GOG / Generic: look for folders with goggame-*.info or treat each subfolder as a title ----
async function scanGenericDir(
  dir: FileSystemDirectoryHandle,
  platform: Platform,
): Promise<ScannedGame[]> {
  const games: ScannedGame[] = [];
  // @ts-ignore
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== "directory") continue;
    let title = name;
    let id: string | undefined;
    try {
      const sub = handle as FileSystemDirectoryHandle;
      // @ts-ignore
      for await (const [fname, fhandle] of sub.entries()) {
        if (
          fhandle.kind === "file" &&
          fname.startsWith("goggame-") &&
          fname.endsWith(".info")
        ) {
          const f = await (fhandle as FileSystemFileHandle).getFile();
          try {
            const j = JSON.parse(await f.text());
            title = j.name || title;
            id = j.gameId ? `gog:${j.gameId}` : id;
          } catch {
            /* ignore */
          }
          break;
        }
      }
    } catch {
      /* ignore */
    }
    games.push({
      title,
      external_id: id ?? `${platform}:${name.toLowerCase().replace(/\s+/g, "-")}`,
      platform,
      installed: true,
    });
  }
  return games;
}

export type ScanKind = "steam" | "epic" | "gog" | "generic";

export async function pickAndScan(
  kind: ScanKind,
  platformForGeneric: Platform = "other",
): Promise<ScannedGame[]> {
  if (!isFileSystemAccessSupported()) {
    throw new Error(
      "Your browser does not support folder scanning. Use a Chromium-based desktop browser (Chrome, Edge, Brave).",
    );
  }
  // @ts-expect-error - showDirectoryPicker not in lib.dom yet
  const dir: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    id: `lovable-scan-${kind}`,
    mode: "read",
  });
  switch (kind) {
    case "steam":
      return scanSteamDir(dir);
    case "epic":
      return scanEpicDir(dir);
    case "gog":
      return scanGenericDir(dir, "other");
    case "generic":
    default:
      return scanGenericDir(dir, platformForGeneric);
  }
}

// Group scanned games by platform for batched import
export function groupByPlatform(games: ScannedGame[]): Record<Platform, ScannedGame[]> {
  const out = {} as Record<Platform, ScannedGame[]>;
  for (const g of games) {
    (out[g.platform] ||= []).push(g);
  }
  return out;
}
