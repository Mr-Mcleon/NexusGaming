import { Play, Cloud, Download, Star, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Game {
  id: string;
  title: string;
  image: string;
  rating: number;
  playtime?: number;
  players?: number;
  status: "installed" | "cloud" | "available" | "downloading";
  progress?: number;
  lastPlayed?: string;
  tags?: string[];
}

interface GameCardProps {
  game: Game;
  variant?: "default" | "compact" | "featured";
  onPlay?: () => void;
}

export const GameCard = ({ game, variant = "default", onPlay }: GameCardProps) => {
  const statusConfig = {
    installed: { icon: Play, label: "Play", color: "text-online" },
    cloud: { icon: Cloud, label: "Stream", color: "text-primary" },
    available: { icon: Download, label: "Install", color: "text-muted-foreground" },
    downloading: { icon: Download, label: `${game.progress}%`, color: "text-warning" },
  };

  const { icon: StatusIcon, label, color } = statusConfig[game.status];

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4 p-3 rounded-xl glass-card hover:bg-secondary/50 transition-all duration-200 group cursor-pointer">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{game.title}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {game.lastPlayed && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {game.lastPlayed}
              </span>
            )}
            {game.playtime && (
              <span>{game.playtime}h played</span>
            )}
          </div>
        </div>
        <Button 
          variant="gaming" 
          size="sm" 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onPlay}
        >
          <StatusIcon className="w-4 h-4" />
          {label}
        </Button>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
        <img 
          src={game.image} 
          alt={game.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            {game.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">{game.title}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              {game.rating}
            </span>
            {game.players && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {game.players.toLocaleString()} playing
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="gaming" size="lg" onClick={onPlay}>
              <StatusIcon className="w-5 h-5" />
              {label} Now
            </Button>
            <Button variant="glass" size="lg">
              Add to Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl overflow-hidden glass-card card-elevated transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] cursor-pointer">
      <div className="aspect-[3/4] overflow-hidden">
        <img 
          src={game.image} 
          alt={game.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Status Badge */}
      <div className={cn(
        "absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
        game.status === "installed" && "bg-online/20 text-online",
        game.status === "cloud" && "bg-primary/20 text-primary",
        game.status === "downloading" && "bg-warning/20 text-warning",
        game.status === "available" && "bg-muted text-muted-foreground"
      )}>
        <StatusIcon className="w-3 h-3" />
        {game.status === "downloading" ? `${game.progress}%` : game.status.charAt(0).toUpperCase() + game.status.slice(1)}
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card to-transparent">
        <h3 className="font-medium text-foreground mb-1 truncate">{game.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-3 h-3 text-warning fill-warning" />
            {game.rating}
          </div>
          {game.playtime && (
            <span className="text-xs text-muted-foreground">{game.playtime}h</span>
          )}
        </div>
      </div>

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
        <Button 
          variant="gaming" 
          size="lg" 
          className="shadow-2xl"
          onClick={onPlay}
        >
          <StatusIcon className="w-5 h-5" />
          {label}
        </Button>
      </div>

      {/* Download Progress */}
      {game.status === "downloading" && game.progress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${game.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
