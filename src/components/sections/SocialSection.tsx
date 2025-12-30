import { useState } from "react";
import { 
  Users, 
  MessageSquare, 
  Phone, 
  Video, 
  UserPlus, 
  Search,
  MoreHorizontal,
  Gamepad2,
  Eye,
  ChevronRight,
  Hash,
  Volume2,
  Crown,
  Shield,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "playing" | "idle" | "offline";
  game?: string;
  mutualFriends?: number;
}

interface Server {
  id: string;
  name: string;
  icon: string;
  members: number;
  online: number;
  channels: { id: string; name: string; type: "text" | "voice"; unread?: number }[];
}

const friends: Friend[] = [
  { id: "1", name: "ProGamer99", avatar: "P", status: "playing", game: "Cyber Odyssey 2077", mutualFriends: 12 },
  { id: "2", name: "NightHawk", avatar: "N", status: "online", mutualFriends: 8 },
  { id: "3", name: "ShadowBlade", avatar: "S", status: "playing", game: "Stellar Wars", mutualFriends: 5 },
  { id: "4", name: "CryptoWolf", avatar: "C", status: "idle", mutualFriends: 3 },
  { id: "5", name: "QuantumX", avatar: "Q", status: "offline", mutualFriends: 15 },
  { id: "6", name: "BlazeFury", avatar: "B", status: "online", mutualFriends: 7 },
  { id: "7", name: "IceStorm", avatar: "I", status: "playing", game: "Apex Hunter", mutualFriends: 4 },
];

const servers: Server[] = [
  {
    id: "1",
    name: "Nexus Gaming Hub",
    icon: "🎮",
    members: 15420,
    online: 3241,
    channels: [
      { id: "1", name: "general", type: "text", unread: 12 },
      { id: "2", name: "announcements", type: "text" },
      { id: "3", name: "Voice Lobby", type: "voice" },
    ],
  },
  {
    id: "2",
    name: "Competitive League",
    icon: "🏆",
    members: 8920,
    online: 1523,
    channels: [
      { id: "4", name: "ranked-chat", type: "text", unread: 5 },
      { id: "5", name: "scrims", type: "voice" },
    ],
  },
];

const statusColors = {
  online: "bg-online",
  playing: "bg-primary",
  idle: "bg-warning",
  offline: "bg-offline",
};

export const SocialSection = () => {
  const [activeTab, setActiveTab] = useState<"friends" | "servers">("friends");
  const [searchQuery, setSearchQuery] = useState("");

  const onlineFriends = friends.filter(f => f.status !== "offline");
  const offlineFriends = friends.filter(f => f.status === "offline");

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold">Social</h1>
            <Button variant="gaming">
              <UserPlus className="w-4 h-4" />
              Add Friend
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4">
            {[
              { id: "friends", label: "Friends", icon: Users, count: onlineFriends.length },
              { id: "servers", label: "Servers", icon: Hash, count: servers.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "friends" | "servers")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  activeTab === tab.id ? "bg-primary/20" : "bg-muted"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-gaming p-6">
          {activeTab === "friends" ? (
            <div className="space-y-6">
              {/* Online Friends */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Online — {onlineFriends.length}
                </h3>
                <div className="space-y-2">
                  {onlineFriends.map((friend) => (
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
                          statusColors[friend.status]
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{friend.name}</h4>
                          {friend.mutualFriends && friend.mutualFriends > 10 && (
                            <Star className="w-4 h-4 text-warning" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {friend.game ? (
                            <span className="flex items-center gap-1">
                              <Gamepad2 className="w-3 h-3" />
                              Playing {friend.game}
                            </span>
                          ) : (
                            friend.status === "idle" ? "Away" : "Online"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Phone className="w-4 h-4" />
                        </Button>
                        {friend.game && (
                          <Button variant="neon" size="sm">
                            <Eye className="w-4 h-4" />
                            Spectate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offline Friends */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Offline — {offlineFriends.length}
                </h3>
                <div className="space-y-2">
                  {offlineFriends.map((friend) => (
                    <div 
                      key={friend.id}
                      className="flex items-center gap-4 p-3 rounded-xl glass-card opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                          {friend.avatar}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card bg-offline" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{friend.name}</h4>
                        <p className="text-sm text-muted-foreground">Offline</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {servers.map((server) => (
                <div 
                  key={server.id}
                  className="glass-card rounded-xl overflow-hidden"
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                      {server.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold">{server.name}</h3>
                        <Crown className="w-4 h-4 text-warning" />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-online" />
                          {server.online.toLocaleString()} online
                        </span>
                        <span>{server.members.toLocaleString()} members</span>
                      </div>
                    </div>
                    <Button variant="glass">
                      Open
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto">
                    {server.channels.map((channel) => (
                      <button
                        key={channel.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors whitespace-nowrap"
                      >
                        {channel.type === "text" ? (
                          <Hash className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{channel.name}</span>
                        {channel.unread && (
                          <span className="px-1.5 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">
                            {channel.unread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Discover Servers */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/20 text-center">
                <h3 className="font-display text-lg font-bold mb-2">Discover Communities</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find servers for your favorite games and interests
                </p>
                <Button variant="gaming">
                  <Search className="w-4 h-4" />
                  Browse Servers
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
