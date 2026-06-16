import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Grid, List, SlidersHorizontal, ChevronDown, Cloud, Download, HardDrive, Heart, Play, Clock, Square, Bookmark, Tag, ArrowUpDown, Share2, FileJson, FileSpreadsheet, Copy, Bell, BellOff, X, Link, Check, RefreshCw, Gamepad2 as Gamepad2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserLibrary, useToggleFavorite, useRemoveFromLibrary, useUpdatePlayTime, useAddToLibrary, LibraryEntry } from "@/hooks/useGames";
import { useSetPlayingStatus } from "@/hooks/usePlayingStatus";
import { useLogActivity } from "@/hooks/useActivityFeed";
import { useWishlistWithGames, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { usePriceAlerts, useSetPriceAlert, useRemovePriceAlert } from "@/hooks/usePriceAlerts";
import { useWishlistShare, useCreateWishlistShare, useToggleWishlistShare, useRegenerateShareToken } from "@/hooks/useWishlistShare";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useExternalGames, useDeleteExternalGame, PLATFORM_LABELS, ExternalGame } from "@/hooks/useLinkedAccounts";
import { useMergedPlaytimeCache } from "@/hooks/useMergedPlaytimeCache";

type FilterType = "all" | "favorites" | "recent" | "wishlist" | "external";
type ViewType = "grid" | "list";
type WishlistSortType = "date_added" | "name" | "price_low" | "price_high" | "discount";

const formatPlayTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const LibraryGameCard = ({ 
  entry, 
  variant = "grid",
  isPlaying,
  onPlay,
  onStop,
  onClick
}: { 
  entry: LibraryEntry; 
  variant?: "grid" | "list";
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onClick: () => void;
}) => {
  const toggleFavorite = useToggleFavorite();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate({ gameId: entry.game_id, isFavorite: !entry.is_favorite });
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  if (variant === "list") {
    return (
      <div onClick={onClick} className="group glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-all duration-200 cursor-pointer">
        <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={entry.game.cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200"}
            alt={entry.game.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-lg truncate">{entry.game.title}</h3>
            {isPlaying && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full animate-pulse">
                Playing
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{entry.game.developer}</p>
          <div className="flex items-center gap-4 mt-2">
            {entry.play_time_minutes > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatPlayTime(entry.play_time_minutes)}
              </div>
            )}
            {entry.game.genres?.slice(0, 2).map((genre) => (
              <span key={genre} className="px-2 py-0.5 bg-secondary text-xs rounded-full text-muted-foreground">
                {genre}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "p-2 rounded-lg transition-colors",
              entry.is_favorite ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart className={cn("w-5 h-5", entry.is_favorite && "fill-current")} />
          </button>
          <Button 
            variant={isPlaying ? "destructive" : "gaming"} 
            size="sm"
            onClick={handlePlayClick}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer">
      {isPlaying && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-primary/90 text-primary-foreground text-xs rounded-full animate-pulse">
          Playing
        </div>
      )}
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={entry.game.cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"}
          alt={entry.game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <button
        onClick={handleFavoriteClick}
        className={cn(
          "absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm transition-all",
          entry.is_favorite 
            ? "bg-destructive/20 text-destructive" 
            : "bg-background/50 text-muted-foreground opacity-0 group-hover:opacity-100"
        )}
      >
        <Heart className={cn("w-4 h-4", entry.is_favorite && "fill-current")} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 to-background/50 backdrop-blur-sm">
        <h3 className="font-medium text-sm truncate mb-1">{entry.game.title}</h3>
        <div className="flex items-center justify-between">
          {entry.play_time_minutes > 0 ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatPlayTime(entry.play_time_minutes)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not played yet</span>
          )}
          <Button 
            variant={isPlaying ? "destructive" : "gaming"} 
            size="sm" 
            className="h-7 text-xs"
            onClick={handlePlayClick}
          >
            {isPlaying ? (
              <>
                <Square className="w-3 h-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface WishlistGame {
  id: string;
  added_at: string;
  game: {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    price: number | null;
    sale_price: number | null;
    rating: number | null;
    genres: string[] | null;
  } | null;
}

const WishlistGameCard = ({ 
  item, 
  variant = "grid",
  onClick,
  onAddToLibrary,
  onRemove,
  priceAlert,
  onSetPriceAlert,
  onRemovePriceAlert
}: { 
  item: WishlistGame; 
  variant?: "grid" | "list";
  onClick: () => void;
  onAddToLibrary: () => void;
  onRemove: () => void;
  priceAlert?: { target_price: number; notified: boolean };
  onSetPriceAlert: (price: number) => void;
  onRemovePriceAlert: () => void;
}) => {
  const [alertPrice, setAlertPrice] = useState(priceAlert?.target_price?.toString() || "");
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  if (!item.game) return null;

  const isOnSale = item.game.sale_price !== null && item.game.sale_price < (item.game.price || 0);
  const discountPercent = isOnSale && item.game.price 
    ? Math.round(((item.game.price - item.game.sale_price!) / item.game.price) * 100)
    : 0;

  const renderPrice = () => {
    if (item.game!.price === 0 || item.game!.price === null) {
      return <span className="text-primary font-semibold">Free</span>;
    }
    if (isOnSale) {
      return (
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">
            -{discountPercent}%
          </span>
          <span className="text-muted-foreground line-through text-sm">
            ${item.game!.price.toFixed(2)}
          </span>
          <span className="text-green-400 font-semibold">
            ${item.game!.sale_price!.toFixed(2)}
          </span>
        </div>
      );
    }
    return <span className="text-primary font-semibold">${item.game!.price.toFixed(2)}</span>;
  };

  if (variant === "list") {
    return (
      <div onClick={onClick} className="group glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-all duration-200 cursor-pointer">
        <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={item.game.cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200"}
            alt={item.game.title}
            className="w-full h-full object-cover"
          />
          {isOnSale && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
              -{discountPercent}%
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-lg truncate">{item.game.title}</h3>
            {isOnSale && (
              <Tag className="w-4 h-4 text-green-400" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{item.game.description}</p>
          <div className="flex items-center gap-4 mt-2">
            {renderPrice()}
            {item.game.genres?.slice(0, 2).map((genre) => (
              <span key={genre} className="px-2 py-0.5 bg-secondary text-xs rounded-full text-muted-foreground">
                {genre}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  priceAlert && "border-amber-500/50 text-amber-400"
                )}
              >
                {priceAlert ? (
                  <>
                    <Bell className="w-4 h-4 mr-1 fill-current" />
                    ${priceAlert.target_price.toFixed(2)}
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-1" />
                    Alert
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price Alert</span>
                  {priceAlert && (
                    <button
                      onClick={() => {
                        onRemovePriceAlert();
                        setIsAlertOpen(false);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Get notified when the price drops to your target
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.game?.price || 100}
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      const price = parseFloat(alertPrice);
                      if (price > 0) {
                        onSetPriceAlert(price);
                        setIsAlertOpen(false);
                      }
                    }}
                  >
                    Set
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current: ${(item.game?.sale_price ?? item.game?.price ?? 0).toFixed(2)}
                </p>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Heart className="w-4 h-4 mr-1 fill-current text-destructive" />
            Remove
          </Button>
          <Button 
            variant="gaming" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToLibrary();
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            Add to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer">
      {isOnSale && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
          -{discountPercent}% OFF
        </div>
      )}
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={item.game.cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"}
          alt={item.game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="absolute top-2 right-2 flex gap-1">
        <Popover open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "p-2 rounded-lg backdrop-blur-sm transition-all",
                priceAlert 
                  ? "bg-amber-500/20 text-amber-400" 
                  : "bg-background/50 text-muted-foreground opacity-0 group-hover:opacity-100"
              )}
            >
              <Bell className={cn("w-4 h-4", priceAlert && "fill-current")} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price Alert</span>
                {priceAlert && (
                  <button
                    onClick={() => {
                      onRemovePriceAlert();
                      setIsAlertOpen(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    className="pl-6 h-8 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <Button 
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    const price = parseFloat(alertPrice);
                    if (price > 0) {
                      onSetPriceAlert(price);
                      setIsAlertOpen(false);
                    }
                  }}
                >
                  Set
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 rounded-lg backdrop-blur-sm transition-all bg-destructive/20 text-destructive"
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 to-background/50 backdrop-blur-sm">
        <h3 className="font-medium text-sm truncate mb-1">{item.game.title}</h3>
        <div className="flex items-center justify-between">
          {isOnSale ? (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground line-through text-xs">
                ${item.game.price?.toFixed(2)}
              </span>
              <span className="text-green-400 font-semibold text-sm">
                ${item.game.sale_price!.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-primary font-semibold text-sm">
              {item.game.price === 0 || item.game.price === null ? "Free" : `$${item.game.price.toFixed(2)}`}
            </span>
          )}
          <Button 
            variant="gaming" 
            size="sm" 
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onAddToLibrary();
            }}
          >
            <Download className="w-3 h-3 mr-1" />
            Get
          </Button>
        </div>
      </div>
    </div>
  );
};

// Merge external games sharing the same normalized title across platforms.
const normalizeExternalTitle = (t: string) =>
  t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

interface PlatformPlaytime {
  platform: ExternalGame["platform"];
  minutes: number;
  count: number;
}

interface MergedExternalGame {
  key: string;
  title: string;
  cover_image_url?: string | null;
  totalPlaytime: number;
  byPlatform: PlatformPlaytime[];
  entries: ExternalGame[];
}

const mergeExternalGames = (games: ExternalGame[]): MergedExternalGame[] => {
  const map = new Map<string, MergedExternalGame>();
  for (const g of games) {
    const key = normalizeExternalTitle(g.title);
    const minutes = g.playtime_minutes ?? 0;
    const existing = map.get(key);
    if (existing) {
      existing.entries.push(g);
      existing.totalPlaytime += minutes;
      if (!existing.cover_image_url && g.cover_image_url) existing.cover_image_url = g.cover_image_url;
      if (g.title.length > existing.title.length) existing.title = g.title;
      const bp = existing.byPlatform.find((p) => p.platform === g.platform);
      if (bp) {
        bp.minutes += minutes;
        bp.count += 1;
      } else {
        existing.byPlatform.push({ platform: g.platform, minutes, count: 1 });
      }
    } else {
      map.set(key, {
        key,
        title: g.title,
        cover_image_url: g.cover_image_url,
        totalPlaytime: minutes,
        byPlatform: [{ platform: g.platform, minutes, count: 1 }],
        entries: [g],
      });
    }
  }
  for (const m of map.values()) {
    m.byPlatform.sort((a, b) => b.minutes - a.minutes);
  }
  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
};

const PlaytimeBreakdown = ({ merged }: { merged: MergedExternalGame }) => {
  const total = merged.totalPlaytime;
  return (
    <div className="w-56">
      <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-border/50">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Total playtime</span>
        <span className="text-sm font-semibold tabular-nums">{formatPlayTime(total)}</span>
      </div>
      <ul className="space-y-1.5">
        {merged.byPlatform.map((p) => {
          const pct = total > 0 ? Math.round((p.minutes / total) * 100) : 0;
          return (
            <li key={p.platform} className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{PLATFORM_LABELS[p.platform]}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {p.minutes > 0 ? formatPlayTime(p.minutes) : "—"}
                  {total > 0 && p.minutes > 0 && ` · ${pct}%`}
                </span>
              </div>
              {total > 0 && (
                <div className="mt-1 h-1 rounded-full bg-secondary/60 overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const PlatformChips = ({
  entries,
  size = "sm",
}: {
  entries: ExternalGame[];
  size?: "sm" | "xs";
}) => {
  const cls = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((e) => (
        <span
          key={e.id}
          className={`${cls} rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm`}
          title={
            e.playtime_minutes
              ? `${formatPlayTime(e.playtime_minutes)} on ${PLATFORM_LABELS[e.platform]}`
              : PLATFORM_LABELS[e.platform]
          }
        >
          {PLATFORM_LABELS[e.platform]}
        </span>
      ))}
    </div>
  );
};

const TotalPlaytimePill = ({
  merged,
  variant = "muted",
}: {
  merged: MergedExternalGame;
  variant?: "muted" | "overlay";
}) => {
  if (merged.totalPlaytime <= 0) return null;
  const base =
    variant === "overlay"
      ? "bg-background/70 hover:bg-background/90 text-foreground"
      : "bg-secondary/60 hover:bg-secondary text-foreground";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs backdrop-blur-sm transition-colors ${base}`}
          title="View per-platform breakdown"
        >
          <Clock className="w-3 h-3" />
          <span className="tabular-nums">{formatPlayTime(merged.totalPlaytime)}</span>
          <span className="opacity-70">total</span>
          {merged.byPlatform.length > 1 && (
            <span className="opacity-70">· {merged.byPlatform.length}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="p-3 w-auto">
        <PlaytimeBreakdown merged={merged} />
      </PopoverContent>
    </Popover>
  );
};

const ExternalGamesGrid = ({
  games,
  isLoading,
  view,
  onDelete,
}: {
  games: ExternalGame[];
  isLoading: boolean;
  view: ViewType;
  onDelete: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const merged = mergeExternalGames(games);
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    );
  }
  if (merged.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Link className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No external games yet</p>
        <p className="text-sm">
          Link an account in Settings → Linked Accounts and import your library.
        </p>
        <Button variant="gaming" size="sm" className="mt-4" onClick={() => navigate("/settings")}>
          Open Settings
        </Button>
      </div>
    );
  }
  const deleteAll = (m: MergedExternalGame) => m.entries.forEach((e) => onDelete(e.id));
  if (view === "list") {
    return (
      <div className="space-y-3">
        {merged.map((m) => (
          <div key={m.key} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary/50 flex items-center justify-center">
              {m.cover_image_url ? (
                <img src={m.cover_image_url} alt={m.title} className="w-full h-full object-cover" />
              ) : (
                <Gamepad2Icon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{m.title}</h3>
              <div className="mt-1">
                <PlatformChips entries={m.entries} />
              </div>
              {m.totalPlaytime > 0 && (
                <div className="mt-2">
                  <TotalPlaytimePill merged={m} />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAll(m)}
              title={m.entries.length > 1 ? "Remove from all platforms" : "Remove"}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {merged.map((m) => (
        <div
          key={m.key}
          className="group relative rounded-xl overflow-hidden bg-card border border-border/50"
        >
          <div className="aspect-[3/4] overflow-hidden bg-secondary/40 flex items-center justify-center">
            {m.cover_image_url ? (
              <img src={m.cover_image_url} alt={m.title} className="w-full h-full object-cover" />
            ) : (
              <Gamepad2Icon className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <button
            onClick={() => deleteAll(m)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-2 left-2 max-w-[calc(100%-3rem)]">
            <PlatformChips entries={m.entries} size="xs" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 to-transparent space-y-2">
            <h3 className="font-medium text-sm truncate">{m.title}</h3>
            {m.totalPlaytime > 0 && <TotalPlaytimePill merged={m} variant="overlay" />}
          </div>
        </div>
      ))}
    </div>
  );
};

export const LibrarySection = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<ViewType>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false);
  const [wishlistSort, setWishlistSort] = useState<WishlistSortType>("date_added");
  const [currentlyPlayingGameId, setCurrentlyPlayingGameId] = useState<string | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  
  const { data: library = [], isLoading } = useUserLibrary();
  const { data: wishlist = [], isLoading: isLoadingWishlist } = useWishlistWithGames();
  const { data: externalGames = [], isLoading: isLoadingExternal } = useExternalGames();
  const deleteExternal = useDeleteExternalGame();
  const { data: priceAlerts = [] } = usePriceAlerts();
  const { setPlaying, stopPlaying } = useSetPlayingStatus();
  const updatePlayTime = useUpdatePlayTime();
  const logActivity = useLogActivity();
  const addToLibrary = useAddToLibrary();
  const removeFromWishlist = useRemoveFromWishlist();
  const setPriceAlert = useSetPriceAlert();
  const removePriceAlert = useRemovePriceAlert();
  const { data: wishlistShare } = useWishlistShare();
  const createWishlistShare = useCreateWishlistShare();
  const toggleWishlistShare = useToggleWishlistShare();
  const regenerateShareToken = useRegenerateShareToken();
  const [copied, setCopied] = useState(false);

  const getPriceAlertForGame = (gameId: string) => {
    return priceAlerts.find(alert => alert.game_id === gameId);
  };

  const getShareUrl = () => {
    if (!wishlistShare?.share_token) return "";
    return `${window.location.origin}/wishlist/${wishlistShare.share_token}`;
  };

  const handleCopyShareLink = async () => {
    const url = getShareUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateShare = async () => {
    await createWishlistShare.mutateAsync();
  };

  const handlePlay = async (gameId: string, gameTitle: string) => {
    const success = await setPlaying(gameId);
    if (success) {
      setCurrentlyPlayingGameId(gameId);
      playStartTimeRef.current = Date.now();
      logActivity.mutate({ activityType: "game_started", gameId });
      toast.success(`Now playing ${gameTitle}`);
    }
  };

  const handleStop = async () => {
    const gameId = currentlyPlayingGameId;
    const startTime = playStartTimeRef.current;
    
    const success = await stopPlaying();
    if (success) {
      // Log stop activity
      if (gameId) {
        logActivity.mutate({ activityType: "game_stopped", gameId });
      }
      
      // Calculate elapsed time and update play time
      if (gameId && startTime) {
        const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);
        const entry = library.find(e => e.game_id === gameId);
        if (entry && elapsedMinutes > 0) {
          const newTotal = entry.play_time_minutes + elapsedMinutes;
          updatePlayTime.mutate({ gameId, minutes: newTotal });
          toast.info(`Stopped playing (+${elapsedMinutes}m added)`);
        } else {
          toast.info("Stopped playing");
        }
      } else {
        toast.info("Stopped playing");
      }
      
      setCurrentlyPlayingGameId(null);
      playStartTimeRef.current = null;
    }
  };

  const handleAddWishlistToLibrary = (gameId: string) => {
    addToLibrary.mutate(gameId, {
      onSuccess: () => {
        removeFromWishlist.mutate(gameId);
      }
    });
  };

  const filteredLibrary = library.filter((entry) => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "favorites" && entry.is_favorite) ||
      (filter === "recent" && entry.last_played_at);
    const matchesSearch = entry.game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredWishlist = (wishlist as WishlistGame[])
    .filter((item) => {
      if (!item.game) return false;
      const matchesSearch = item.game.title.toLowerCase().includes(searchQuery.toLowerCase());
      const isOnSale = item.game.sale_price !== null && item.game.sale_price < (item.game.price || 0);
      const matchesSaleFilter = !showOnSaleOnly || isOnSale;
      return matchesSearch && matchesSaleFilter;
    })
    .sort((a, b) => {
      if (!a.game || !b.game) return 0;
      
      const getEffectivePrice = (game: WishlistGame["game"]) => {
        if (!game) return 0;
        return game.sale_price !== null ? game.sale_price : (game.price || 0);
      };
      
      const getDiscount = (game: WishlistGame["game"]) => {
        if (!game || !game.price || game.sale_price === null) return 0;
        return ((game.price - game.sale_price) / game.price) * 100;
      };

      switch (wishlistSort) {
        case "name":
          return a.game.title.localeCompare(b.game.title);
        case "price_low":
          return getEffectivePrice(a.game) - getEffectivePrice(b.game);
        case "price_high":
          return getEffectivePrice(b.game) - getEffectivePrice(a.game);
        case "discount":
          return getDiscount(b.game) - getDiscount(a.game);
        case "date_added":
        default:
          return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
      }
    });

  const onSaleCount = (wishlist as WishlistGame[]).filter((item) => {
    if (!item.game) return false;
    return item.game.sale_price !== null && item.game.sale_price < (item.game.price || 0);
  }).length;

  const sortOptions: { id: WishlistSortType; label: string }[] = [
    { id: "date_added", label: "Date Added" },
    { id: "name", label: "Name (A-Z)" },
    { id: "price_low", label: "Price: Low to High" },
    { id: "price_high", label: "Price: High to Low" },
    { id: "discount", label: "Discount %" },
  ];

  const filteredExternal = externalGames.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filterOptions: { id: FilterType; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "all", label: "All Games", icon: Grid, count: library.length },
    { id: "favorites", label: "Favorites", icon: Heart, count: library.filter(e => e.is_favorite).length },
    { id: "recent", label: "Recently Played", icon: Clock, count: library.filter(e => e.last_played_at).length },
    { id: "wishlist", label: "Wishlist", icon: Bookmark, count: wishlist.length },
    { id: "external", label: "External", icon: Link, count: externalGames.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">My Library</h1>
            <p className="text-muted-foreground">
              {filter === "wishlist"
                ? `${filteredWishlist.length} games in your wishlist`
                : filter === "external"
                  ? (() => {
                      const uniq = new Set(filteredExternal.map((g) => g.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim())).size;
                      return uniq === filteredExternal.length
                        ? `${filteredExternal.length} imported from linked accounts`
                        : `${uniq} unique titles · ${filteredExternal.length} entries across platforms`;
                    })()
                  : `${filteredLibrary.length} games in your collection`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* On Sale Filter - Only show for wishlist */}
            {filter === "wishlist" && onSaleCount > 0 && (
              <button
                onClick={() => setShowOnSaleOnly(!showOnSaleOnly)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border",
                  showOnSaleOnly
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-secondary/50 text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                )}
              >
                <Tag className="w-4 h-4" />
                <span className="font-medium text-sm">On Sale</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  showOnSaleOnly ? "bg-green-500/30 text-green-400" : "bg-muted text-muted-foreground"
                )}>
                  {onSaleCount}
                </span>
              </button>
            )}
            {/* Sort Dropdown - Only show for wishlist */}
            {filter === "wishlist" && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-muted-foreground hover:text-foreground hover:border-border transition-all">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="font-medium text-sm">{sortOptions.find(o => o.id === wishlistSort)?.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setWishlistSort(option.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg",
                        wishlistSort === option.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button - Only show for wishlist */}
            {filter === "wishlist" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn(
                      "gap-2",
                      wishlistShare?.is_active && "border-primary/50 text-primary"
                    )}
                  >
                    <Link className="w-4 h-4" />
                    Share
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Share Wishlist</h4>
                        <p className="text-xs text-muted-foreground">
                          Let others view your wishlist
                        </p>
                      </div>
                      {wishlistShare && (
                        <Switch
                          checked={wishlistShare.is_active}
                          onCheckedChange={(checked) => toggleWishlistShare.mutate(checked)}
                        />
                      )}
                    </div>
                    
                    {!wishlistShare ? (
                      <Button 
                        onClick={handleCreateShare} 
                        className="w-full"
                        disabled={createWishlistShare.isPending}
                      >
                        {createWishlistShare.isPending ? "Creating..." : "Create Share Link"}
                      </Button>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={getShareUrl()}
                            className="text-xs bg-secondary/50"
                          />
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={handleCopyShareLink}
                          >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">
                            Generate new link
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateShareToken.mutate()}
                            disabled={regenerateShareToken.isPending}
                          >
                            <RefreshCw className={cn("w-4 h-4 mr-1", regenerateShareToken.isPending && "animate-spin")} />
                            Regenerate
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Export Dropdown - Only show for wishlist */}
            {filter === "wishlist" && filteredWishlist.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-muted-foreground hover:text-foreground hover:border-border transition-all">
                  <Share2 className="w-4 h-4" />
                  <span className="font-medium text-sm">Export</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={() => {
                      const data = filteredWishlist.map(item => ({
                        title: item.game?.title,
                        price: item.game?.price,
                        salePrice: item.game?.sale_price,
                        genres: item.game?.genres,
                        addedAt: item.added_at
                      }));
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'wishlist.json';
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Wishlist exported as JSON');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors rounded-t-lg"
                  >
                    <FileJson className="w-4 h-4" />
                    Download JSON
                  </button>
                  <button
                    onClick={() => {
                      const headers = ['Title', 'Price', 'Sale Price', 'Discount %', 'Genres', 'Added At'];
                      const rows = filteredWishlist.map(item => {
                        const price = item.game?.price || 0;
                        const salePrice = item.game?.sale_price;
                        const discount = salePrice !== null && price > 0 
                          ? Math.round(((price - salePrice) / price) * 100) 
                          : 0;
                        return [
                          `"${item.game?.title || ''}"`,
                          price.toFixed(2),
                          salePrice !== null ? salePrice.toFixed(2) : '',
                          discount > 0 ? `${discount}%` : '',
                          `"${item.game?.genres?.join(', ') || ''}"`,
                          new Date(item.added_at).toLocaleDateString()
                        ].join(',');
                      });
                      const csv = [headers.join(','), ...rows].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'wishlist.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Wishlist exported as CSV');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download CSV
                  </button>
                  <button
                    onClick={() => {
                      const text = filteredWishlist.map(item => {
                        const price = item.game?.price || 0;
                        const salePrice = item.game?.sale_price;
                        const priceText = salePrice !== null 
                          ? `$${salePrice.toFixed(2)} (was $${price.toFixed(2)})`
                          : `$${price.toFixed(2)}`;
                        return `• ${item.game?.title} - ${priceText}`;
                      }).join('\n');
                      navigator.clipboard.writeText(text);
                      toast.success('Wishlist copied to clipboard');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors rounded-b-lg"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={filter === "wishlist" ? "Search wishlist..." : "Search library..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center rounded-lg bg-secondary/50 p-1">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-gaming pb-1">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-sm",
                  filter === option.id
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{option.label}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  filter === option.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Games Grid/List */}
      <div className="flex-1 overflow-y-auto scrollbar-gaming p-6">
        {filter === "external" ? (
          <ExternalGamesGrid
            games={filteredExternal}
            isLoading={isLoadingExternal}
            view={view}
            onDelete={(id) => deleteExternal.mutate(id)}
          />
        ) : filter === "wishlist" ? (
          // Wishlist View
          <>
            {isLoadingWishlist ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredWishlist.map((item) => {
                  const alert = item.game ? getPriceAlertForGame(item.game.id) : undefined;
                  return (
                    <WishlistGameCard 
                      key={item.id} 
                      item={item} 
                      variant="grid"
                      onClick={() => navigate(`/game/${item.game?.id}`)}
                      onAddToLibrary={() => item.game && handleAddWishlistToLibrary(item.game.id)}
                      onRemove={() => item.game && removeFromWishlist.mutate(item.game.id)}
                      priceAlert={alert ? { target_price: alert.target_price, notified: alert.notified } : undefined}
                      onSetPriceAlert={(price) => item.game && setPriceAlert.mutate({ gameId: item.game.id, targetPrice: price })}
                      onRemovePriceAlert={() => item.game && removePriceAlert.mutate(item.game.id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWishlist.map((item) => {
                  const alert = item.game ? getPriceAlertForGame(item.game.id) : undefined;
                  return (
                    <WishlistGameCard 
                      key={item.id} 
                      item={item} 
                      variant="list"
                      onClick={() => navigate(`/game/${item.game?.id}`)}
                      onAddToLibrary={() => item.game && handleAddWishlistToLibrary(item.game.id)}
                      onRemove={() => item.game && removeFromWishlist.mutate(item.game.id)}
                      priceAlert={alert ? { target_price: alert.target_price, notified: alert.notified } : undefined}
                      onSetPriceAlert={(price) => item.game && setPriceAlert.mutate({ gameId: item.game.id, targetPrice: price })}
                      onRemovePriceAlert={() => item.game && removePriceAlert.mutate(item.game.id)}
                    />
                  );
                })}
              </div>
            )}

            {!isLoadingWishlist && filteredWishlist.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Bookmark className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {wishlist.length === 0 ? "Your wishlist is empty" : "No games found"}
                </p>
                <p className="text-sm">
                  {wishlist.length === 0 
                    ? "Browse the store and add games to your wishlist" 
                    : "Try adjusting your search"}
                </p>
              </div>
            )}
          </>
        ) : (
          // Library View
          <>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredLibrary.map((entry) => (
                  <LibraryGameCard 
                    key={entry.id} 
                    entry={entry} 
                    variant="grid"
                    isPlaying={currentlyPlayingGameId === entry.game_id}
                    onPlay={() => handlePlay(entry.game_id, entry.game.title)}
                    onStop={handleStop}
                    onClick={() => navigate(`/game/${entry.game_id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLibrary.map((entry) => (
                  <LibraryGameCard 
                    key={entry.id} 
                    entry={entry} 
                    variant="list"
                    isPlaying={currentlyPlayingGameId === entry.game_id}
                    onPlay={() => handlePlay(entry.game_id, entry.game.title)}
                    onStop={handleStop}
                    onClick={() => navigate(`/game/${entry.game_id}`)}
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredLibrary.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {library.length === 0 ? "Your library is empty" : "No games found"}
                </p>
                <p className="text-sm">
                  {library.length === 0 
                    ? "Visit the store to add games to your library" 
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
