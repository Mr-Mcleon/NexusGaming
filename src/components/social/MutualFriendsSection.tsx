import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { MutualFriend } from "@/hooks/useMutualFriends";

interface MutualFriendsSectionProps {
  mutualFriends: MutualFriend[];
  isLoading: boolean;
}

export const MutualFriendsSection = ({ mutualFriends, isLoading }: MutualFriendsSectionProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-12 h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (mutualFriends.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">
          {mutualFriends.length} Mutual Friend{mutualFriends.length !== 1 ? "s" : ""}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {mutualFriends.map((friend) => {
          const name = friend.username || "Unknown";
          return (
            <button
              key={friend.user_id}
              onClick={() => navigate(`/profile/${friend.user_id}`)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <Avatar className="w-12 h-12 rounded-xl border-2 border-transparent group-hover:border-primary/50 transition-all">
                <AvatarImage src={friend.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-secondary to-muted text-sm font-medium">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[64px]">
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
