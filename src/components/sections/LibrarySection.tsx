import { useState } from "react";
import { Search, Grid, List, Filter, SlidersHorizontal, ChevronDown, Play, Cloud, Download, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCard, type Game } from "@/components/games/GameCard";
import { cn } from "@/lib/utils";

const allGames: Game[] = [
  { id: "1", title: "Cyber Odyssey 2077", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=500&fit=crop", rating: 4.8, playtime: 89, status: "installed", tags: ["RPG", "Open World"] },
  { id: "2", title: "Stellar Wars", image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=500&fit=crop", rating: 4.5, playtime: 24, status: "installed" },
  { id: "3", title: "Neon Racer X", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=500&fit=crop", rating: 4.2, playtime: 12, status: "cloud" },
  { id: "4", title: "Shadow Legends", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=500&fit=crop", rating: 4.7, playtime: 156, status: "installed" },
  { id: "5", title: "Quantum Break", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=500&fit=crop", rating: 4.9, status: "available" },
  { id: "6", title: "Dark Horizon", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0c?w=400&h=500&fit=crop", rating: 4.6, status: "cloud" },
  { id: "7", title: "Apex Hunter", image: "https://images.unsplash.com/photo-1493711662062-fa541f7f0cf5?w=400&h=500&fit=crop", rating: 4.4, status: "downloading", progress: 67 },
  { id: "8", title: "Nova Strike", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=500&fit=crop", rating: 4.3, status: "available" },
  { id: "9", title: "Phantom Protocol", image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&h=500&fit=crop", rating: 4.1, status: "installed" },
  { id: "10", title: "Velocity Zero", image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=500&fit=crop", rating: 4.0, status: "cloud" },
  { id: "11", title: "Eclipse Rising", image: "https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=400&h=500&fit=crop", rating: 4.8, status: "installed" },
  { id: "12", title: "Titan's Forge", image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=500&fit=crop", rating: 4.5, status: "available" },
];

type FilterType = "all" | "installed" | "cloud" | "available";
type ViewType = "grid" | "list";

export const LibrarySection = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<ViewType>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = allGames.filter((game) => {
    const matchesFilter = filter === "all" || game.status === filter || (filter === "installed" && game.status === "downloading");
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions: { id: FilterType; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "all", label: "All Games", icon: Grid, count: allGames.length },
    { id: "installed", label: "Installed", icon: HardDrive, count: allGames.filter(g => g.status === "installed" || g.status === "downloading").length },
    { id: "cloud", label: "Cloud", icon: Cloud, count: allGames.filter(g => g.status === "cloud").length },
    { id: "available", label: "Not Installed", icon: Download, count: allGames.filter(g => g.status === "available").length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">My Library</h1>
            <p className="text-muted-foreground">{filteredGames.length} games in your collection</p>
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

            {/* Filters */}
            <Button variant="glass" size="default">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
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
        {view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} variant="compact" />
            ))}
          </div>
        )}

        {filteredGames.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No games found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};
