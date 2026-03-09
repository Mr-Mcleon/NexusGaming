import { useState, useRef, useEffect } from "react";
import {
  Hash,
  Volume2,
  Plus,
  ArrowLeft,
  Send,
  Users,
  Link2,
  Paperclip,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  FileIcon,
  Download,
  Crown,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunityDetails, type Community, type CommunityChannel } from "@/hooks/useCommunities";
import { useChannelChat } from "@/hooks/useChannelChat";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { InviteDialog } from "@/components/community/InviteDialog";

interface CommunityViewProps {
  community: Community;
  onBack: () => void;
}

export const CommunityView = ({ community, onBack }: CommunityViewProps) => {
  const { user } = useAuth();
  const { channels, members, loading, createChannel } = useCommunityDetails(community.id);
  const { isOnline } = usePresence();
  const [activeChannel, setActiveChannel] = useState<CommunityChannel | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"text" | "voice">("text");
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const isOwnerOrAdmin = members.some(
    (m) => m.user_id === user?.id && (m.role === "owner" || m.role === "admin")
  );

  // Auto-select first text channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const firstText = channels.find((c) => c.type === "text");
      if (firstText) setActiveChannel(firstText);
    }
  }, [channels, activeChannel]);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    await createChannel(newChannelName.trim(), newChannelType);
    setNewChannelName("");
    setShowCreateChannel(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg">
          {community.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold truncate">{community.name}</h2>
          <p className="text-xs text-muted-foreground">{members.length} members</p>
        </div>
        {isOwnerOrAdmin && (
          <InviteDialog communityId={community.id} communityName={community.name}>
            <Button variant="ghost" size="icon" className="w-8 h-8" title="Invite">
              <Link2 className="w-4 h-4" />
            </Button>
          </InviteDialog>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={() => setShowMembers(!showMembers)}
        >
          <Users className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Channel sidebar */}
        <div className="w-48 border-r border-border/50 flex flex-col bg-card/50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </span>
              {isOwnerOrAdmin && (
                <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                  <DialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Plus className="w-4 h-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Create Channel</DialogTitle>
                      <DialogDescription>Add a new channel to this community.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="channel-name"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant={newChannelType === "text" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewChannelType("text")}
                        >
                          <Hash className="w-3 h-3 mr-1" /> Text
                        </Button>
                        <Button
                          variant={newChannelType === "voice" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewChannelType("voice")}
                        >
                          <Volume2 className="w-3 h-3 mr-1" /> Voice
                        </Button>
                      </div>
                      <Button onClick={handleCreateChannel} className="w-full" size="sm">
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-0.5">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    activeChannel?.id === ch.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {ch.type === "text" ? (
                    <Hash className="w-4 h-4 shrink-0" />
                  ) : (
                    <Volume2 className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeChannel ? (
            activeChannel.type === "text" ? (
              <ChannelTextChat channel={activeChannel} />
            ) : (
              <ChannelVoiceChat channel={activeChannel} members={members} />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a channel
            </div>
          )}
        </div>

        {/* Members panel */}
        {showMembers && (
          <div className="w-48 border-l border-border/50 p-3 bg-card/50 overflow-y-auto">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Members — {members.length}
            </span>
            <div className="mt-2 space-y-1">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-medium">
                      {m.profile?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                        isOnline(m.user_id) ? "bg-online" : "bg-offline"
                      )}
                    />
                  </div>
                  <span className="truncate flex-1">{m.profile?.username || "Unknown"}</span>
                  {m.role === "owner" && <Crown className="w-3 h-3 text-warning shrink-0" />}
                  {m.role === "admin" && <Shield className="w-3 h-3 text-primary shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Text channel chat component
const ChannelTextChat = ({ channel }: { channel: CommunityChannel }) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChannelChat(channel.id);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) return;

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(path);

      await sendMessage(input || "", { url: publicUrl, name: file.name, type: file.type });
      setInput("");
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isImageType = (type: string | null) => type?.startsWith("image/");

  return (
    <>
      <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2">
        <Hash className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">{channel.name}</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-medium shrink-0">
                  {msg.sender?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{msg.sender?.username || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {msg.file_url && isImageType(msg.file_type) ? (
                    <div className="mt-1">
                      <img
                        src={msg.file_url}
                        alt={msg.file_name || "Image"}
                        className="max-w-[200px] rounded-md cursor-pointer"
                        onClick={() => window.open(msg.file_url!, "_blank")}
                      />
                      {msg.content && msg.content !== msg.file_name && (
                        <p className="text-sm mt-1">{msg.content}</p>
                      )}
                    </div>
                  ) : msg.file_url ? (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-1 p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors max-w-[200px]"
                    >
                      <FileIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate text-xs">{msg.file_name || "File"}</span>
                      <Download className="w-3 h-3 shrink-0 ml-auto" />
                    </a>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border/50">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleFileUpload}
        />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message #${channel.name}`}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isUploading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

// Voice channel component
const ChannelVoiceChat = ({
  channel,
  members: communityMembers,
}: {
  channel: CommunityChannel;
  members: any[];
}) => {
  const { isConnected, isMuted, voiceUsers, joinVoice, leaveVoice, toggleMute } =
    useVoiceChat(channel.id);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">{channel.name}</span>
        {isConnected && (
          <span className="text-xs text-online ml-auto">● Connected</span>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
        {isConnected ? (
          <>
            <div className="grid grid-cols-3 gap-4 max-w-xs">
              {voiceUsers.map((vu) => (
                <div key={vu.userId} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all",
                      vu.isMuted
                        ? "bg-secondary text-muted-foreground"
                        : "bg-gradient-to-br from-primary/30 to-accent/30 ring-2 ring-primary/50"
                    )}
                  >
                    {vu.username[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-xs text-center truncate max-w-full">
                    {vu.username}
                  </span>
                  {vu.isMuted && <MicOff className="w-3 h-3 text-destructive" />}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={leaveVoice}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Join to talk with others</p>
            <Button variant="gaming" onClick={joinVoice}>
              <Phone className="w-4 h-4 mr-2" />
              Join Voice Channel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
