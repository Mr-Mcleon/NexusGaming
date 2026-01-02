import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Phone, 
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
  X,
  Send,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging, useConversation, type Conversation } from "@/hooks/useMessaging";
import { usePresence } from "@/hooks/usePresence";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  unread?: number;
  users?: number;
}

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
  const { user } = useAuth();
  const { conversations, friends, loading: loadingConversations } = useMessaging();
  const { isOnline } = usePresence();
  const [expandedSections, setExpandedSections] = useState({
    conversations: true,
    channels: true,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOpen) return null;

  return (
    <aside className="w-72 h-full bg-sidebar border-l border-border/50 flex flex-col animate-slide-in-right">
      {activeConversation ? (
        <ChatView 
          conversationId={activeConversation} 
          onBack={() => setActiveConversation(null)}
          conversations={conversations}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="font-display font-bold text-foreground">Messages</h2>
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
              New Chat
            </Button>
            <Button variant="glass" size="sm" className="flex-1">
              <Phone className="w-4 h-4" />
              Call
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-gaming">
            {/* Conversations Section */}
            <div className="p-3">
              <button 
                onClick={() => toggleSection("conversations")}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>Conversations — {conversations.length}</span>
                {expandedSections.conversations ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              
              {expandedSections.conversations && (
                <div className="mt-2 space-y-1">
                  {loadingConversations ? (
                    <p className="text-sm text-muted-foreground px-2 py-4">Loading...</p>
                  ) : conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-2 py-4">No conversations yet</p>
                  ) : (
                    conversations.map((convo) => {
                      const otherParticipant = convo.participants.find(p => p.user_id !== user?.id);
                      const isUserOnline = otherParticipant ? isOnline(otherParticipant.user_id) : false;
                      return (
                        <ConversationItem 
                          key={convo.id} 
                          conversation={convo}
                          currentUserId={user?.id}
                          isOnline={isUserOnline}
                          onClick={() => setActiveConversation(convo.id)}
                        />
                      );
                    })
                  )}
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
                {user?.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email?.split("@")[0] || "Guest"}</p>
                <p className="text-xs text-online">Online</p>
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
        </>
      )}
    </aside>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId?: string;
  isOnline: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, currentUserId, isOnline, onClick }: ConversationItemProps) => {
  const otherParticipant = conversation.participants.find(p => p.user_id !== currentUserId);
  const displayName = otherParticipant?.username || "Unknown User";
  const avatar = otherParticipant?.username?.[0]?.toUpperCase() || "?";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors group"
    >
      <div className="relative">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-sm font-medium">
          {avatar}
        </div>
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
          isOnline ? "bg-online" : "bg-offline"
        )} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {conversation.last_message?.content || "No messages yet"}
        </p>
      </div>
      {conversation.unread_count > 0 && (
        <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
          {conversation.unread_count}
        </span>
      )}
    </button>
  );
};

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
  conversations: Conversation[];
}

const ChatView = ({ conversationId, onBack, conversations }: ChatViewProps) => {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const { messages, typingUsers, loading, sendMessage, setTyping, markAsRead } = useConversation(conversationId);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const conversation = conversations.find(c => c.id === conversationId);
  const otherParticipant = conversation?.participants.find(p => p.user_id !== user?.id);
  const isParticipantOnline = otherParticipant ? isOnline(otherParticipant.user_id) : false;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead();
  }, [conversationId, markAsRead]);

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    await sendMessage(messageInput);
    setMessageInput("");
    setTyping(false);
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    
    // Typing indicator logic
    setTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-sm font-medium">
          {otherParticipant?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{otherParticipant?.username || "Unknown"}</p>
          <p className={cn("text-xs", isParticipantOnline ? "text-online" : "text-muted-foreground")}>
            {isParticipantOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground">No messages yet. Say hi!</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-medium shrink-0">
                  {message.sender?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div
                  className={cn(
                    "max-w-[70%] px-3 py-2 rounded-lg text-sm",
                    message.sender_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div className="flex gap-2 items-center text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs">typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!messageInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
};
