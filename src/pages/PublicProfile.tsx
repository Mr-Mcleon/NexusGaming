import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicProfile, usePublicLibrary, usePublicAchievements, usePublicActivity } from "@/hooks/usePublicProfile";
import { useFriends } from "@/hooks/useFriends";
import { useMutualFriends } from "@/hooks/useMutualFriends";
import { MutualFriendsSection } from "@/components/social/MutualFriendsSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Gamepad2, Trophy, Clock, Library, Play, ShoppingCart,
  Square, UserPlus, UserCheck, UserX, Lock, User, CalendarDays, Settings, Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/hooks/useActivityFeed";

const activityConfig: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  game_started: { icon: Play, label: "started playing", color: "text-online" },
  game_stopped: { icon: Square, label: "stopped playing", color: "text-muted-foreground" },
  game_purchased: { icon: ShoppingCart, label: "purchased", color: "text-primary" },
  achievement_unlocked: { icon: Trophy, label: "unlocked an achievement in", color: "text-warning" },
  friend_added: { icon: UserPlus, label: "became friends with someone", color: "text-accent" },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy, "gamepad-2": Gamepad2, library: Library, clock: Clock,
};

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = user?.id === userId;
  const { friends, pendingRequests, sentRequests, sendFriendRequest, acceptRequest, declineRequest, removeFriend } = useFriends();
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const { data: profile, isLoading: profileLoading } = usePublicProfile(userId);
  const { data: library = [], isLoading: libraryLoading } = usePublicLibrary(userId);
  const { data: achievementData, isLoading: achievementsLoading } = usePublicAchievements(userId);
  const { data: activities = [], isLoading: activityLoading } = usePublicActivity(userId);
  const { data: mutualFriends = [], isLoading: mutualFriendsLoading } = useMutualFriends(userId);
  const totalPlaytime = library.reduce((sum, e) => sum + (e.play_time_minutes || 0), 0);
  const playtimeHours = Math.floor(totalPlaytime / 60);
  const unlockedCount = achievementData?.userAchievements?.length || 0;
  const totalAchievements = achievementData?.achievements?.length || 0;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="w-24 h-24 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="font-display text-2xl font-bold mb-2">Player Not Found</h2>
          <p className="text-muted-foreground mb-6">This profile doesn't exist or has been removed.</p>
          <Button variant="gaming" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const username = profile.username || "Unknown Player";

  const isFriend = friends.some(f => f.user_id === userId || f.friend_id === userId);
  const incomingRequest = pendingRequests.find(f => f.user_id === userId);
  const outgoingRequest = sentRequests.find(f => f.friend_id === userId);
  const friendship = friends.find(f => f.user_id === userId || f.friend_id === userId);

  const handleFriendAction = async (action: () => Promise<boolean>) => {
    setFriendActionLoading(true);
    await action();
    setFriendActionLoading(false);
  };

  const renderFriendButton = () => {
    if (!user || isOwnProfile) return null;
    if (isFriend && friendship) {
      return (
        <Button variant="outline" size="sm" disabled={friendActionLoading} onClick={() => handleFriendAction(() => removeFriend(friendship.id))}>
          {friendActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
          Friends
        </Button>
      );
    }
    if (outgoingRequest) {
      return (
        <Button variant="outline" size="sm" disabled className="opacity-70">
          <Clock className="w-4 h-4 mr-2" /> Request Sent
        </Button>
      );
    }
    if (incomingRequest) {
      return (
        <div className="flex gap-2">
          <Button variant="gaming" size="sm" disabled={friendActionLoading} onClick={() => handleFriendAction(() => acceptRequest(incomingRequest.id))}>
            {friendActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Accept
          </Button>
          <Button variant="outline" size="sm" disabled={friendActionLoading} onClick={() => handleFriendAction(() => declineRequest(incomingRequest.id))}>
            <UserX className="w-4 h-4 mr-2" /> Decline
          </Button>
        </div>
      );
    }
    return (
      <Button variant="gaming" size="sm" disabled={friendActionLoading} onClick={() => handleFriendAction(() => sendFriendRequest(userId!))}>
        {friendActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
        Add Friend
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {isOwnProfile && (
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Banner */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24 rounded-2xl border-2 border-primary/30">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 text-3xl font-bold">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
                <h1 className="font-display text-3xl font-bold">{username}</h1>
                {renderFriendButton()}
              </div>
              {profile.bio && (
                <p className="text-muted-foreground mb-3 max-w-lg">{profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  Joined {format(new Date(profile.created_at), "MMM yyyy")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4" />
                  {library.length} games
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {playtimeHours}h played
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  {unlockedCount} achievements
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mutual Friends */}
        {!isOwnProfile && (
          <MutualFriendsSection mutualFriends={mutualFriends} isLoading={mutualFriendsLoading} />
        )}

        {/* Tabs */}
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="w-full justify-start bg-secondary/50">
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Games Tab */}
          <TabsContent value="games">
            {libraryLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : library.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gamepad2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No games in library yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {library.map((entry) => (
                  <Card
                    key={entry.id}
                    className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => entry.game && navigate(`/game/${entry.game.id}`)}
                  >
                    <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                      {entry.game?.cover_image_url ? (
                        <img
                          src={entry.game.cover_image_url}
                          alt={entry.game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{entry.game?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor((entry.play_time_minutes || 0) / 60)}h played
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            {achievementsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Achievements</h3>
                  <Badge variant="secondary">{unlockedCount} / {totalAchievements}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievementData?.achievements?.map((achievement) => {
                    const unlocked = achievementData.userAchievements.find(
                      (ua) => ua.achievement_id === achievement.id
                    );
                    const IconComponent = iconMap[achievement.icon] || Trophy;
                    return (
                      <Card
                        key={achievement.id}
                        className={cn(
                          "transition-all",
                          unlocked ? "bg-primary/10 border-primary/30" : "bg-muted/30 opacity-60"
                        )}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-full",
                            unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {unlocked ? <IconComponent className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium truncate", unlocked ? "text-foreground" : "text-muted-foreground")}>
                              {achievement.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{achievement.description}</p>
                            {unlocked && (
                              <p className="text-xs text-primary mt-1">
                                Unlocked {formatDistanceToNow(new Date(unlocked.unlocked_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            {activityLoading ? (
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
            ) : activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => {
                  const config = activityConfig[activity.activity_type];
                  const Icon = config.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className={cn("p-2 rounded-full bg-secondary", config.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          <img src={activity.game.cover_image_url} alt={activity.game.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
