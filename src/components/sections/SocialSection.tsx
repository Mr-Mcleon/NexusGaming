import { useState, useMemo } from "react";
import { 
  Users, 
  MessageSquare, 
  Phone, 
  UserPlus, 
  Search,
  ChevronRight,
  Hash,
  Volume2,
  Crown,
  Bell,
  UserMinus,
  Gamepad2,
  Activity,
  Trophy,
  BarChart3,
  Ban,
  Plus,
  LogIn,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import { usePlayingStatus } from "@/hooks/usePlayingStatus";
import { AddFriendDialog } from "@/components/social/AddFriendDialog";
import { FriendRequestsDialog } from "@/components/social/FriendRequestsDialog";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { AchievementsList } from "@/components/social/AchievementsList";
import { Leaderboard } from "@/components/social/Leaderboard";
import { Badge } from "@/components/ui/badge";
import { useUserAchievements } from "@/hooks/useAchievements";
import { useBlockUser } from "@/hooks/useBlockedUsers";
import { useCommunities, type Community } from "@/hooks/useCommunities";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import { CommunityView } from "@/components/community/CommunityView";

const statusColors = {
  online: "bg-online",
  playing: "bg-primary",
  idle: "bg-warning",
  offline: "bg-offline",
};

export const SocialSection = () => {
  const { user } = useAuth();
  const { friends, pendingRequests, loading, removeFriend } = useFriends();
  const { isOnline } = usePresence();
  const { data: userAchievements } = useUserAchievements();
  const blockUser = useBlockUser();
  const [activeTab, setActiveTab] = useState<"friends" | "activity" | "leaderboard" | "achievements" | "servers">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const { communities, myCommunities, loading: loadingCommunities, createCommunity, joinCommunity, leaveCommunity, refreshCommunities } = useCommunities();

  // Get friend user IDs for playing status lookup
  const friendUserIds = useMemo(() => 
    friends.map(f => f.user_id === user?.id ? f.friend_id : f.user_id),
    [friends, user?.id]
  );
  
  const { getPlayingGame } = usePlayingStatus(friendUserIds);

  // Get friend profiles with online status and playing game
  const friendProfiles = friends.map(f => {
    const profile = f.user_id === user?.id ? f.receiver_profile : f.sender_profile;
    const friendUserId = f.user_id === user?.id ? f.friend_id : f.user_id;
    const playingGame = getPlayingGame(friendUserId);
    return {
      id: f.id,
      userId: friendUserId,
      name: profile?.username || "Unknown",
      avatar: profile?.username?.[0]?.toUpperCase() || "?",
      online: isOnline(friendUserId),
      playingGame,
    };
  });

  const filteredFriends = friendProfiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If viewing a community, show the community view
  if (activeCommunity) {
    return (
      <div className="h-full">
        <CommunityView community={activeCommunity} onBack={() => setActiveCommunity(null)} onCommunityUpdated={refreshCommunities} />
      </div>
    );
  }

  return (

    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold">Social</h1>
            <div className="flex items-center gap-2">
              <FriendRequestsDialog>
                <Button variant="glass" className="relative">
                  <Bell className="w-4 h-4" />
                  Requests
                  {pendingRequests.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </Button>
              </FriendRequestsDialog>
              <AddFriendDialog>
                <Button variant="gaming">
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </Button>
              </AddFriendDialog>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4">
            {[
              { id: "friends", label: "Friends", icon: Users, count: friendProfiles.length },
              { id: "activity", label: "Activity", icon: Activity, count: null },
              { id: "leaderboard", label: "Leaderboard", icon: BarChart3, count: null },
              { id: "achievements", label: "Achievements", icon: Trophy, count: userAchievements?.length || 0 },
              { id: "servers", label: "Communities", icon: Hash, count: myCommunities.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "friends" | "activity" | "leaderboard" | "achievements" | "servers")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.count !== null && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    activeTab === tab.id ? "bg-primary/20" : "bg-muted"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search - hide for activity and achievements tabs */}
          {activeTab !== "activity" && activeTab !== "achievements" && activeTab !== "leaderboard" && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={activeTab === "friends" ? "Search friends..." : "Search servers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-gaming p-6">
          {activeTab === "friends" ? (
            <div className="space-y-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading friends...</p>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "No friends found" : "No friends yet"}
                  </p>
                  {!searchQuery && (
                    <AddFriendDialog>
                      <Button variant="gaming">
                        <UserPlus className="w-4 h-4" />
                        Add your first friend
                      </Button>
                    </AddFriendDialog>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Friends — {filteredFriends.length}
                  </h3>
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => (
                      <div 
                        key={friend.id}
                        className="flex items-center gap-4 p-3 rounded-xl glass-card hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-lg font-bold">
                            {friend.avatar}
                          </div>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card",
                            friend.online ? "bg-online" : "bg-offline"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/profile/${friend.userId}`} className="font-medium hover:text-primary hover:underline transition-colors">{friend.name}</Link>
                          {friend.playingGame ? (
                            <p className="text-sm text-primary flex items-center gap-1">
                              <Gamepad2 className="w-3 h-3" />
                              Playing {friend.playingGame}
                            </p>
                          ) : (
                            <p className={cn("text-sm", friend.online ? "text-online" : "text-muted-foreground")}>
                              {friend.online ? "Online" : "Offline"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-destructive hover:text-destructive"
                            onClick={() => removeFriend(friend.id)}
                            title="Remove friend"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              blockUser.mutate(friend.userId);
                              removeFriend(friend.id);
                            }}
                            title="Block user"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "activity" ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Recent Activity
              </h3>
              <ActivityFeed />
            </div>
          ) : activeTab === "leaderboard" ? (
            <Leaderboard />
          ) : activeTab === "achievements" ? (
            <AchievementsList />
          ) : (
            <div className="space-y-4">
              {/* Create community button */}
              <CreateCommunityDialog onSubmit={createCommunity}>
                <Button variant="gaming" className="w-full">
                  <Plus className="w-4 h-4" />
                  Create Community
                </Button>
              </CreateCommunityDialog>

              {/* My communities */}
              {myCommunities.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    My Communities — {myCommunities.length}
                  </h3>
                  <div className="space-y-3">
                    {myCommunities.map((community) => (
                      <div key={community.id} className="glass-card rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                            {community.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-bold truncate">{community.name}</h3>
                              {community.owner_id === user?.id && <Crown className="w-4 h-4 text-warning shrink-0" />}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{community.description || "No description"}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="glass" onClick={() => setActiveCommunity(community)}>
                              Open
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            {community.owner_id !== user?.id && (
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => leaveCommunity(community.id)}>
                                <LogOut className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discover communities */}
              {communities.filter(c => !c.is_member).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Discover Communities
                  </h3>
                  <div className="space-y-3">
                    {communities.filter(c => !c.is_member).map((community) => (
                      <div key={community.id} className="glass-card rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                            {community.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-bold truncate">{community.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{community.description || "No description"}</p>
                          </div>
                          <Button variant="gaming" onClick={() => joinCommunity(community.id)}>
                            <LogIn className="w-4 h-4" />
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communities.length === 0 && !loadingCommunities && (
                <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/20 text-center">
                  <h3 className="font-display text-lg font-bold mb-2">No Communities Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create the first community and invite your friends!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
