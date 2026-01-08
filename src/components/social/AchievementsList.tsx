import { useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Gamepad2, Library, Archive, Clock, Timer, Flame, 
  Users, Heart, Star, MessageSquare, Lock 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  "gamepad-2": Gamepad2,
  library: Library,
  archive: Archive,
  clock: Clock,
  timer: Timer,
  flame: Flame,
  users: Users,
  heart: Heart,
  star: Star,
  "message-square": MessageSquare,
};

export const AchievementsList = () => {
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userAchievementsLoading } = useUserAchievements();

  if (achievementsLoading || userAchievementsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
  const unlockedMap = new Map(
    userAchievements?.map((ua) => [ua.achievement_id, ua.unlocked_at]) || []
  );

  const unlockedCount = userAchievements?.length || 0;
  const totalCount = achievements?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
        <Badge variant="secondary">
          {unlockedCount} / {totalCount}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {achievements?.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const unlockedAt = unlockedMap.get(achievement.id);
          const IconComponent = iconMap[achievement.icon] || Trophy;

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                isUnlocked
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/30 opacity-60"
              }`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    isUnlocked
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isUnlocked ? (
                    <IconComponent className="h-6 w-6" />
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      isUnlocked ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {achievement.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {achievement.description}
                  </p>
                  {isUnlocked && unlockedAt && (
                    <p className="text-xs text-primary mt-1">
                      Unlocked {formatDistanceToNow(new Date(unlockedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!achievements || achievements.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No achievements available yet</p>
        </div>
      )}
    </div>
  );
};
