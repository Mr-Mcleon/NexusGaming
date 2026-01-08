import { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type SortBy = "playtime" | "achievements";

const formatPlaytime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const rankColors = [
  "from-yellow-400 to-amber-500", // 1st - Gold
  "from-slate-300 to-slate-400",  // 2nd - Silver
  "from-amber-600 to-orange-700", // 3rd - Bronze
];

export const Leaderboard = () => {
  const { user } = useAuth();
  const { data: entries, isLoading } = useLeaderboard();
  const [sortBy, setSortBy] = useState<SortBy>("playtime");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sortedEntries = [...(entries || [])].sort((a, b) => {
    if (sortBy === "playtime") {
      return b.totalPlaytime - a.totalPlaytime;
    }
    return b.achievementCount - a.achievementCount;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Leaderboard</h3>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "playtime" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("playtime")}
          >
            <Clock className="w-4 h-4 mr-1" />
            Playtime
          </Button>
          <Button
            variant={sortBy === "achievements" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("achievements")}
          >
            <Trophy className="w-4 h-4 mr-1" />
            Achievements
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedEntries.map((entry, index) => {
          const isCurrentUser = entry.userId === user?.id;
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <Card
              key={entry.userId}
              className={cn(
                "transition-all",
                isCurrentUser && "ring-2 ring-primary/50",
                isTopThree && "bg-gradient-to-r from-primary/5 to-transparent"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Rank */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                    isTopThree
                      ? `bg-gradient-to-br ${rankColors[index]} text-white`
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isTopThree ? <Medal className="w-5 h-5" /> : rank}
                </div>

                {/* Avatar */}
                <div className="relative">
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.username}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-lg font-bold">
                      {entry.username[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* Name & Stats */}
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium truncate", isCurrentUser && "text-primary")}>
                    {entry.username}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatPlaytime(entry.totalPlaytime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {entry.achievementCount} badges
                    </span>
                  </div>
                </div>

                {/* Primary Stat */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {sortBy === "playtime"
                      ? formatPlaytime(entry.totalPlaytime)
                      : entry.achievementCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sortBy === "playtime" ? "total playtime" : "achievements"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!sortedEntries || sortedEntries.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Add friends to see the leaderboard</p>
          </div>
        )}
      </div>
    </div>
  );
};
