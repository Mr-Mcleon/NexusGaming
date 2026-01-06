import { useState, useRef } from "react";
import { Search, Grid, List, SlidersHorizontal, ChevronDown, Cloud, Download, HardDrive, Heart, Play, Clock, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserLibrary, useToggleFavorite, useRemoveFromLibrary, useUpdatePlayTime, LibraryEntry } from "@/hooks/useGames";
import { useSetPlayingStatus } from "@/hooks/usePlayingStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type FilterType = "all" | "favorites" | "recent";
type ViewType = "grid" | "list";

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
  onStop
}: { 
  entry: LibraryEntry; 
  variant?: "grid" | "list";
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
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
      <div className="group glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-all duration-200 cursor-pointer">
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
    <div className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer">
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

export const LibrarySection = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<ViewType>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentlyPlayingGameId, setCurrentlyPlayingGameId] = useState<string | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  
  const { data: library = [], isLoading } = useUserLibrary();
  const { setPlaying, stopPlaying } = useSetPlayingStatus();
  const updatePlayTime = useUpdatePlayTime();

  const handlePlay = async (gameId: string, gameTitle: string) => {
    const success = await setPlaying(gameId);
    if (success) {
      setCurrentlyPlayingGameId(gameId);
      playStartTimeRef.current = Date.now();
      toast.success(`Now playing ${gameTitle}`);
    }
  };

  const handleStop = async () => {
    const gameId = currentlyPlayingGameId;
    const startTime = playStartTimeRef.current;
    
    const success = await stopPlaying();
    if (success) {
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

  const filteredLibrary = library.filter((entry) => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "favorites" && entry.is_favorite) ||
      (filter === "recent" && entry.last_played_at);
    const matchesSearch = entry.game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions: { id: FilterType; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "all", label: "All Games", icon: Grid, count: library.length },
    { id: "favorites", label: "Favorites", icon: Heart, count: library.filter(e => e.is_favorite).length },
    { id: "recent", label: "Recently Played", icon: Clock, count: library.filter(e => e.last_played_at).length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">My Library</h1>
            <p className="text-muted-foreground">{filteredLibrary.length} games in your collection</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search library..."
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
      </div>
    </div>
  );
};
