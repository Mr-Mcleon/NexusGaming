import { useState } from "react";
import { Play, ChevronRight, Sparkles, TrendingUp, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCard, type Game } from "@/components/games/GameCard";

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
  return (
    <div className="p-6 space-y-8 overflow-y-auto scrollbar-gaming h-full">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/10 to-transparent p-6 border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Welcome Back</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">
            Ready to <span className="gradient-text">Play</span>, NexusPlayer?
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

      {/* Quick Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </section>
    </div>
  );
};
