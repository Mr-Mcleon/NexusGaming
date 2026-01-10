import { useState } from "react";
import { Clock, Star, ChevronRight, Flame, Gift, Percent, Plus, Check, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGames, useUserLibrary, useAddToLibrary, Game } from "@/hooks/useGames";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { id: "all", label: "All", emoji: "🎮" },
  { id: "action", label: "Action", emoji: "⚔️" },
  { id: "rpg", label: "RPG", emoji: "🧙" },
  { id: "strategy", label: "Strategy", emoji: "♟️" },
  { id: "racing", label: "Racing", emoji: "🏎️" },
  { id: "indie", label: "Indie", emoji: "🎨" },
  { id: "puzzle", label: "Puzzle", emoji: "🧩" },
  { id: "horror", label: "Horror", emoji: "👻" },
];

const StoreGameCard = ({ 
  game, 
  isOwned,
  isWishlisted,
  onAddToLibrary,
  onToggleWishlist,
  isAdding,
  isTogglingWishlist,
}: { 
  game: Game; 
  isOwned: boolean;
  isWishlisted: boolean;
  onAddToLibrary: () => void;
  onToggleWishlist: () => void;
  isAdding: boolean;
  isTogglingWishlist: boolean;
}) => {
  return (
    <div className="group glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={game.cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {game.price === 0 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
            FREE
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isOwned && (
            <div className="px-2 py-1 bg-online/90 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Owned
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist();
            }}
            disabled={isTogglingWishlist}
            className={cn(
              "p-1.5 rounded-full transition-all",
              isWishlisted 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-background/80 text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {game.genres?.slice(0, 2).map((genre) => (
            <span key={genre} className="px-2 py-0.5 bg-secondary text-xs rounded-full text-muted-foreground">
              {genre}
            </span>
          ))}
        </div>
        <h3 className="font-medium text-sm mb-1 truncate">{game.title}</h3>
        <p className="text-xs text-muted-foreground mb-2 truncate">{game.developer}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm">{game.rating}</span>
              </div>
            )}
          </div>
          <span className="font-bold text-primary">
            {game.price === 0 ? "Free" : `$${game.price}`}
          </span>
        </div>
        <div className="mt-3">
          {isOwned ? (
            <Button variant="glass" size="sm" className="w-full" disabled>
              <Check className="w-4 h-4 mr-1" />
              In Library
            </Button>
          ) : (
            <Button 
              variant="gaming" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onAddToLibrary();
              }}
              disabled={isAdding}
            >
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Library
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const StoreSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: games = [], isLoading: gamesLoading } = useGames();
  const { data: library = [] } = useUserLibrary();
  const { data: wishlist = [] } = useWishlist();
  const addToLibrary = useAddToLibrary();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const ownedGameIds = new Set(library.map(entry => entry.game_id));
  const wishlistedGameIds = new Set(wishlist.map(entry => entry.game_id));

  const toggleWishlist = (gameId: string) => {
    if (wishlistedGameIds.has(gameId)) {
      removeFromWishlist.mutate(gameId);
    } else {
      addToWishlist.mutate(gameId);
    }
  };

  const filteredGames = games.filter(game => {
    if (activeCategory === "all") return true;
    return game.genres?.some(genre => 
      genre.toLowerCase().includes(activeCategory.toLowerCase())
    );
  });

  const featuredGame = games[0];
  const freeGames = games.filter(g => g.price === 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-gaming">
      {/* Hero Banner */}
      {featuredGame && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={featuredGame.cover_image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"}
            alt={featuredGame.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full mb-3 inline-block">
              Featured Game
            </span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold mb-3">{featuredGame.title}</h1>
            <div className="flex items-center gap-4 mb-4">
              {featuredGame.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-warning fill-warning" />
                  <span className="font-medium">{featuredGame.rating}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {featuredGame.genres?.map((genre) => (
                  <span key={genre} className="text-sm text-muted-foreground">{genre}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">
                {featuredGame.price === 0 ? "Free to Play" : `$${featuredGame.price}`}
              </span>
              {ownedGameIds.has(featuredGame.id) ? (
                <Button variant="glass" size="xl" disabled>
                  <Check className="w-5 h-5 mr-2" />
                  In Library
                </Button>
              ) : (
                <Button 
                  variant="gaming" 
                  size="xl"
                  onClick={() => addToLibrary.mutate(featuredGame.id)}
                  disabled={addToLibrary.isPending}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Library
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Categories */}
        <section>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-gaming">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "glass-card hover:bg-secondary"
                )}
              >
                <span>{cat.emoji}</span>
                <span className="font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* All Games */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">
                {activeCategory === "all" ? "All Games" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Games`}
              </h2>
            </div>
          </div>

          {gamesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGames.map((game) => (
                <StoreGameCard
                  key={game.id}
                  game={game}
                  isOwned={ownedGameIds.has(game.id)}
                  isWishlisted={wishlistedGameIds.has(game.id)}
                  onAddToLibrary={() => addToLibrary.mutate(game.id)}
                  onToggleWishlist={() => toggleWishlist(game.id)}
                  isAdding={addToLibrary.isPending}
                  isTogglingWishlist={addToWishlist.isPending || removeFromWishlist.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* Free to Play Banner */}
        {freeGames.length > 0 && (
          <section className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-accent/20 via-primary/10 to-transparent border border-accent/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Gift className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Free to Play</span>
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Play for Free</h2>
                <p className="text-muted-foreground max-w-md">
                  {freeGames.length} free games available. No payment required, just instant fun!
                </p>
              </div>
              <Button 
                variant="gaming" 
                size="lg"
                onClick={() => setActiveCategory("all")}
              >
                Browse Free Games
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
