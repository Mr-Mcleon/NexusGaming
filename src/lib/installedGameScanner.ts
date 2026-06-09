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

// ---- Battle.net: each subfolder is a product; .build.info names the product code ----
const BNET_PRODUCT_NAMES: Record<string, string> = {
  wow: "World of Warcraft",
  wow_classic: "World of Warcraft Classic",
  pro: "Overwatch 2",
  prometheus: "Overwatch 2",
  hero: "Heroes of the Storm",
  s1: "StarCraft Remastered",
  s2: "StarCraft II",
  d3: "Diablo III",
  d4: "Diablo IV",
  fenris: "Diablo IV",
  hs_beta: "Hearthstone",
  w3: "Warcraft III: Reforged",
  odin: "Call of Duty: Modern Warfare",
  zeus: "Call of Duty: Modern Warfare II",
};

async function scanBattleNetDir(dir: FileSystemDirectoryHandle): Promise<ScannedGame[]> {
  const games: ScannedGame[] = [];
  // @ts-ignore
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== "directory") continue;
    if (name.startsWith(".") || name.toLowerCase() === "battle.net")
      continue;
    let title = name;
    let code: string | undefined;
    try {
      const sub = handle as FileSystemDirectoryHandle;
      const buildInfo = await sub.getFileHandle(".build.info").catch(() => null);
      if (buildInfo) {
        const text = await (await buildInfo.getFile()).text();
        // CSV-ish; first column header "Branch!STRING" sometimes contains product
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length >= 2) {
          const headers = lines[0].split("|").map((h) => h.split("!")[0].toLowerCase());
          const row = lines[1].split("|");
          const idx = headers.findIndex((h) => h === "product");
          if (idx >= 0 && row[idx]) {
            code = row[idx].trim();
            if (BNET_PRODUCT_NAMES[code]) title = BNET_PRODUCT_NAMES[code];
          }
        }
      }
    } catch {
      /* ignore */
    }
    games.push({
      title,
      external_id: `battlenet:${code ?? name.toLowerCase().replace(/\s+/g, "-")}`,
      platform: "other",
      installed: true,
    });
  }
  return games;
}

// ---- EA app / Origin: .mfst files with URL-encoded query string (id=<offerId>) ----
async function scanEaDir(dir: FileSystemDirectoryHandle): Promise<ScannedGame[]> {
  const games: ScannedGame[] = [];
  const walk = async (d: FileSystemDirectoryHandle, depth: number) => {
    if (depth > 3) return;
    // @ts-ignore
    for await (const [name, handle] of d.entries()) {
      if (handle.kind === "directory") {
        await walk(handle as FileSystemDirectoryHandle, depth + 1);
      } else if (
        handle.kind === "file" &&
        (name.endsWith(".mfst") || name.endsWith(".dipinst") || name === "installerdata.xml")
      ) {
        try {
          const file = await (handle as FileSystemFileHandle).getFile();
          const text = await file.text();
          let id: string | undefined;
          let title: string | undefined;
          // .mfst is "?id=Origin.OFR.0.0.12345&..." style
          const idMatch = text.match(/[?&]id=([^&\s"]+)/);
          if (idMatch) id = decodeURIComponent(idMatch[1]);
          // installerdata.xml may include <gameTitle>
          const titleMatch = text.match(/<gameTitle[^>]*>([^<]+)<\/gameTitle>/i);
          if (titleMatch) title = titleMatch[1].trim();
          // Otherwise use containing folder name
          title = title || name.replace(/\.[^.]+$/, "");
          games.push({
            title,
            external_id: id ? `ea:${id}` : `ea:${title.toLowerCase().replace(/\s+/g, "-")}`,
            platform: "other",
            installed: true,
          });
        } catch {
          /* ignore */
        }
      }
    }
  };
  await walk(dir, 0);
  // Deduplicate by external_id
  const seen = new Set<string>();
  return games.filter((g) => {
    const k = g.external_id ?? g.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export type ScanKind = "steam" | "epic" | "gog" | "battlenet" | "ea" | "custom" | "generic";

export interface CustomScanOptions {
  platform?: Platform;
  manifestExt?: string; // e.g. ".acf", ".item", ".mfst"
  recurse?: boolean;
  titleRegex?: string; // optional regex with first capture group = title
  idRegex?: string; // optional regex with first capture group = id
}

async function scanCustomDir(
  dir: FileSystemDirectoryHandle,
  opts: CustomScanOptions,
): Promise<ScannedGame[]> {
  const platform = opts.platform ?? "other";
  if (!opts.manifestExt && !opts.titleRegex) {
    return scanGenericDir(dir, platform);
  }
  const ext = opts.manifestExt?.toLowerCase();
  const titleRe = opts.titleRegex ? new RegExp(opts.titleRegex, "i") : null;
  const idRe = opts.idRegex ? new RegExp(opts.idRegex, "i") : null;
  const games: ScannedGame[] = [];
  const walk = async (d: FileSystemDirectoryHandle, depth: number) => {
    if (depth > (opts.recurse ? 4 : 1)) return;
    // @ts-ignore
    for await (const [name, handle] of d.entries()) {
      if (handle.kind === "directory" && opts.recurse) {
        await walk(handle as FileSystemDirectoryHandle, depth + 1);
      } else if (
        handle.kind === "file" &&
        (!ext || name.toLowerCase().endsWith(ext))
      ) {
        try {
          const file = await (handle as FileSystemFileHandle).getFile();
          const text = await file.text();
          const title =
            (titleRe && text.match(titleRe)?.[1]) ||
            name.replace(/\.[^.]+$/, "");
          const id = idRe ? text.match(idRe)?.[1] : undefined;
          games.push({
            title: title.trim(),
            external_id: id ? `${platform}:${id}` : undefined,
            platform,
            installed: true,
          });
        } catch {
          /* ignore */
        }
      }
    }
  };
  await walk(dir, 0);
  return games;
}

export async function pickAndScan(
  kind: ScanKind,
  platformForGeneric: Platform = "other",
  customOptions?: CustomScanOptions,
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
    case "battlenet":
      return scanBattleNetDir(dir);
    case "ea":
      return scanEaDir(dir);
    case "custom":
      return scanCustomDir(dir, {
        ...customOptions,
        platform: customOptions?.platform ?? platformForGeneric,
      });
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
