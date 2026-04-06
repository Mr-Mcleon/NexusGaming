import { useState } from "react";
import { Play, ChevronRight, Sparkles, TrendingUp, Clock, Zap, Star, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GameCard, type Game } from "@/components/games/GameCard";
import { StreamerCard } from "@/components/streaming/StreamerCard";
import { ClipsGallery } from "@/components/streaming/ClipsGallery";
import { HotkeyCheatSheet } from "@/components/streaming/HotkeyCheatSheet";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const featuredGame: Game = {
  id: "1",
  title: "Cyber Odyssey 2077",
  image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop",
  rating: 4.8,
  players: 125000,
  status: "installed",
  tags: ["Open World", "RPG", "Cyberpunk"],
};

const recentGames: Game[] = [
  {
    id: "2",
    title: "Stellar Wars",
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=400&fit=crop",
    rating: 4.5,
    playtime: 24,
    status: "installed",
    lastPlayed: "2h ago",
  },
  {
    id: "3",
    title: "Neon Racer X",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
    rating: 4.2,
    playtime: 12,
    status: "cloud",
    lastPlayed: "Yesterday",
  },
  {
    id: "4",
    title: "Shadow Legends",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=400&fit=crop",
    rating: 4.7,
    playtime: 156,
    status: "installed",
    lastPlayed: "3 days ago",
  },
];

const trendingGames: Game[] = [
  {
    id: "5",
    title: "Quantum Break",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=500&fit=crop",
    rating: 4.9,
    status: "available",
  },
  {
    id: "6",
    title: "Dark Horizon",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0c?w=400&h=500&fit=crop",
    rating: 4.6,
    status: "cloud",
  },
  {
    id: "7",
    title: "Apex Hunter",
    image: "https://images.unsplash.com/photo-1493711662062-fa541f7f0cf5?w=400&h=500&fit=crop",
    rating: 4.4,
    status: "downloading",
    progress: 67,
  },
  {
    id: "8",
    title: "Nova Strike",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=500&fit=crop",
    rating: 4.3,
    status: "available",
  },
];

export const HomeSection = () => {
  const { data: recommendations, isLoading: recsLoading } = useRecommendations(8);
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 overflow-y-auto scrollbar-gaming h-full">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/10 to-transparent p-4 md:p-6 border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Welcome Back</span>
          </div>
          <h1 className="font-display text-2xl lg:text-4xl font-bold mb-2">
            Ready to <span className="gradient-text">Play</span>?
          </h1>
          <p className="text-muted-foreground max-w-xl">
            You have 3 games ready to launch, 2 friends online, and 1 download in progress.
          </p>
        </div>
      </div>

      {/* Featured Game */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Featured</h2>
          </div>
        </div>
        <GameCard game={featuredGame} variant="featured" />
      </section>

      {/* Continue Playing */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Continue Playing</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {recentGames.map((game) => (
            <GameCard key={game.id} game={game} variant="compact" />
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Trending Now</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendingGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Recommended For You */}
      {(recsLoading || (recommendations && recommendations.length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Recommended For You</h2>
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </div>
          </div>
          {recsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <Skeleton className="aspect-[3/4]" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations?.map((game) => (
                <div
                  key={game.id}
                  className="group relative rounded-xl overflow-hidden glass-card card-elevated transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] cursor-pointer"
                  onClick={() => navigate(`/game/${game.id}`)}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    {game.cover_image_url ? (
                      <img
                        src={game.cover_image_url}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Match reasons */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {game.matchReasons.map((reason) => (
                      <span
                        key={reason}
                        className="px-1.5 py-0.5 bg-primary/80 backdrop-blur-sm text-primary-foreground text-[10px] rounded-full font-medium"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card to-transparent">
                    <h3 className="font-medium text-sm truncate">{game.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      {game.rating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          {game.rating}
                        </div>
                      )}
                      {game.sale_price && game.price ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground line-through">${game.price}</span>
                          <span className="text-xs font-bold text-primary">${game.sale_price}</span>
                        </div>
                      ) : game.price ? (
                        <span className="text-xs text-muted-foreground">${game.price}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Streamer Section & Clips Gallery */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Screen Recording Card */}
        <StreamerCard />
        
        {/* Clips Gallery */}
        <ClipsGallery />
      </section>

      {/* Quick Stats */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Games Owned", value: "127", icon: "🎮", color: "from-primary/20 to-primary/5" },
            { label: "Hours Played", value: "1,284", icon: "⏱️", color: "from-accent/20 to-accent/5" },
            { label: "Achievements", value: "342", icon: "🏆", color: "from-warning/20 to-warning/5" },
            { label: "Friends Online", value: "12", icon: "👥", color: "from-online/20 to-online/5" },
          ].map((stat) => (
            <div 
              key={stat.label}
              className={`glass-card p-4 rounded-xl bg-gradient-to-br ${stat.color}`}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="font-display text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      <HotkeyCheatSheet />
    </div>
  );
};
