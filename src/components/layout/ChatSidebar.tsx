import { useState } from "react";
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Users, 
  Plus, 
  Hash, 
  Volume2,
  ChevronDown,
  ChevronRight,
  Mic,
  MicOff,
  Headphones,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Friend {
  id: string;
  name: string;
  status: "online" | "playing" | "idle" | "offline";
  game?: string;
  avatar: string;
}

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  unread?: number;
  users?: number;
}

const friends: Friend[] = [
  { id: "1", name: "ProGamer99", status: "playing", game: "Cyber Odyssey", avatar: "P" },
  { id: "2", name: "NightHawk", status: "online", avatar: "N" },
  { id: "3", name: "ShadowBlade", status: "playing", game: "Stellar Wars", avatar: "S" },
  { id: "4", name: "CryptoWolf", status: "idle", avatar: "C" },
  { id: "5", name: "QuantumX", status: "offline", avatar: "Q" },
];

const channels: Channel[] = [
  { id: "1", name: "general", type: "text", unread: 5 },
  { id: "2", name: "gaming-chat", type: "text" },
  { id: "3", name: "Voice Lobby", type: "voice", users: 3 },
  { id: "4", name: "Party Room", type: "voice" },
];

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSidebar = ({ isOpen, onClose }: ChatSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    friends: true,
    channels: true,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const statusColors = {
    online: "bg-online",
    playing: "bg-primary",
    idle: "bg-warning",
    offline: "bg-offline",
  };

  if (!isOpen) return null;

  return (
    <aside className="w-72 h-full bg-sidebar border-l border-border/50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="font-display font-bold text-foreground">Social</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 p-4 border-b border-border/50">
        <Button variant="neon" size="sm" className="flex-1">
          <MessageSquare className="w-4 h-4" />
          Chat
        </Button>
        <Button variant="glass" size="sm" className="flex-1">
          <Phone className="w-4 h-4" />
          Call
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-gaming">
        {/* Friends Section */}
        <div className="p-3">
          <button 
            onClick={() => toggleSection("friends")}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Friends — {friends.filter(f => f.status !== "offline").length} Online</span>
            {expandedSections.friends ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.friends && (
            <div className="mt-2 space-y-1">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors group"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-sm font-medium">
                      {friend.avatar}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
                      statusColors[friend.status]
                    )} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{friend.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {friend.game || (friend.status === "online" ? "Online" : friend.status === "idle" ? "Away" : "Offline")}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <MessageSquare className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Channels Section */}
        <div className="p-3 border-t border-border/50">
          <button 
            onClick={() => toggleSection("channels")}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>Gaming Hub</span>
            {expandedSections.channels ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.channels && (
            <div className="mt-2 space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  {channel.type === "text" ? (
                    <Hash className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span className="flex-1 text-left text-sm">{channel.name}</span>
                  {channel.unread && (
                    <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {channel.unread}
                    </span>
                  )}
                  {channel.users && (
                    <span className="text-xs text-muted-foreground">{channel.users}</span>
                  )}
                </button>
              ))}
              <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Channel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="p-3 border-t border-border/50 bg-background/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-secondary/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
            N
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">NexusPlayer</p>
            <p className="text-xs text-online">Voice Connected</p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isMuted ? "bg-destructive/20 text-destructive" : "hover:bg-secondary text-muted-foreground"
              )}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsDeafened(!isDeafened)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isDeafened ? "bg-destructive/20 text-destructive" : "hover:bg-secondary text-muted-foreground"
              )}
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
