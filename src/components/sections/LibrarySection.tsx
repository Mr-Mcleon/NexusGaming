import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Grid, List, SlidersHorizontal, ChevronDown, Cloud, Download, HardDrive, Heart, Play, Clock, Square, Bookmark, Tag, ArrowUpDown, Share2, FileJson, FileSpreadsheet, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserLibrary, useToggleFavorite, useRemoveFromLibrary, useUpdatePlayTime, useAddToLibrary, LibraryEntry } from "@/hooks/useGames";
import { useSetPlayingStatus } from "@/hooks/usePlayingStatus";
import { useLogActivity } from "@/hooks/useActivityFeed";
import { useWishlistWithGames, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type FilterType = "all" | "favorites" | "recent" | "wishlist";
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
  onRemove
}: { 
  item: WishlistGame; 
  variant?: "grid" | "list";
  onClick: () => void;
  onAddToLibrary: () => void;
  onRemove: () => void;
}) => {
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
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm transition-all bg-destructive/20 text-destructive"
      >
        <Heart className="w-4 h-4 fill-current" />
      </button>

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
  const { setPlaying, stopPlaying } = useSetPlayingStatus();
  const updatePlayTime = useUpdatePlayTime();
  const logActivity = useLogActivity();
  const addToLibrary = useAddToLibrary();
  const removeFromWishlist = useRemoveFromWishlist();

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

  const filterOptions: { id: FilterType; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "all", label: "All Games", icon: Grid, count: library.length },
    { id: "favorites", label: "Favorites", icon: Heart, count: library.filter(e => e.is_favorite).length },
    { id: "recent", label: "Recently Played", icon: Clock, count: library.filter(e => e.last_played_at).length },
    { id: "wishlist", label: "Wishlist", icon: Bookmark, count: wishlist.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">My Library</h1>
            <p className="text-muted-foreground">
              {filter === "wishlist" 
                ? `${filteredWishlist.length} games in your wishlist`
                : `${filteredLibrary.length} games in your collection`
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
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
                className="w-64 h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
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
        <div className="flex items-center gap-2 mt-4">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
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
        {filter === "wishlist" ? (
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
                {filteredWishlist.map((item) => (
                  <WishlistGameCard 
                    key={item.id} 
                    item={item} 
                    variant="grid"
                    onClick={() => navigate(`/game/${item.game?.id}`)}
                    onAddToLibrary={() => item.game && handleAddWishlistToLibrary(item.game.id)}
                    onRemove={() => item.game && removeFromWishlist.mutate(item.game.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWishlist.map((item) => (
                  <WishlistGameCard 
                    key={item.id} 
                    item={item} 
                    variant="list"
                    onClick={() => navigate(`/game/${item.game?.id}`)}
                    onAddToLibrary={() => item.game && handleAddWishlistToLibrary(item.game.id)}
                    onRemove={() => item.game && removeFromWishlist.mutate(item.game.id)}
                  />
                ))}
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
