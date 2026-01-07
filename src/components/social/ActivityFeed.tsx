import { formatDistanceToNow } from "date-fns";
import { Play, ShoppingCart, Trophy, UserPlus, Square, Gamepad2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeed, Activity, ActivityType } from "@/hooks/useActivityFeed";
import { cn } from "@/lib/utils";

const activityConfig: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  game_started: { icon: Play, label: "started playing", color: "text-online" },
  game_stopped: { icon: Square, label: "stopped playing", color: "text-muted-foreground" },
  game_purchased: { icon: ShoppingCart, label: "purchased", color: "text-primary" },
  achievement_unlocked: { icon: Trophy, label: "unlocked an achievement in", color: "text-warning" },
  friend_added: { icon: UserPlus, label: "became friends with someone", color: "text-accent" },
};

const ActivityItem = ({ activity }: { activity: Activity }) => {
  const config = activityConfig[activity.activity_type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={activity.profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {activity.profile?.username?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">
            {activity.profile?.username || "Someone"}
          </span>
          <Icon className={cn("w-4 h-4", config.color)} />
          <span className="text-muted-foreground">{config.label}</span>
          {activity.game && (
            <span className="font-medium text-primary">{activity.game.title}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>

      {activity.game?.cover_image_url && (
        <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
          <img
            src={activity.game.cover_image_url}
            alt={activity.game.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export const ActivityFeed = () => {
  const { data: activities = [], isLoading } = useActivityFeed();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Gamepad2 className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No recent activity</p>
        <p className="text-sm">Friend activities will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
};
