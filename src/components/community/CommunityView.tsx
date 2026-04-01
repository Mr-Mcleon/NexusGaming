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
  MoreVertical,
  UserMinus,
  ShieldCheck,
  ShieldOff,
  Settings,
  Pencil,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InviteDialog } from "@/components/community/InviteDialog";
import { CommunitySettingsDialog } from "@/components/community/CommunitySettingsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CommunityMember } from "@/hooks/useCommunities";

interface CommunityViewProps {
  community: Community;
  onBack: () => void;
}

export const CommunityView = ({ community, onBack, onCommunityUpdated }: CommunityViewProps & { onCommunityUpdated?: () => void }) => {
  const { user } = useAuth();
  const { channels, members, loading, createChannel, renameChannel, deleteChannel, updateMemberRole, kickMember } = useCommunityDetails(community.id);
  const { isOnline } = usePresence();
  const [activeChannel, setActiveChannel] = useState<CommunityChannel | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"text" | "voice">("text");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelName, setEditingChannelName] = useState("");
  const [channelToDelete, setChannelToDelete] = useState<CommunityChannel | null>(null);

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
          <>
            <CommunitySettingsDialog community={community} onUpdated={onCommunityUpdated || (() => {})} onDeleted={() => { onCommunityUpdated?.(); onBack(); }}>
              <Button variant="ghost" size="icon" className="w-8 h-8" title="Settings">
                <Settings className="w-4 h-4" />
              </Button>
            </CommunitySettingsDialog>
            <InviteDialog communityId={community.id} communityName={community.name}>
              <Button variant="ghost" size="icon" className="w-8 h-8" title="Invite">
                <Link2 className="w-4 h-4" />
              </Button>
            </InviteDialog>
          </>
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
                <div key={ch.id} className="group flex items-center">
                  {editingChannelId === ch.id ? (
                    <form
                      className="flex-1 flex items-center gap-1 px-2 py-1"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (editingChannelName.trim() && editingChannelName.trim() !== ch.name) {
                          await renameChannel(ch.id, editingChannelName.trim());
                        }
                        setEditingChannelId(null);
                      }}
                    >
                      <Input
                        value={editingChannelName}
                        onChange={(e) => setEditingChannelName(e.target.value)}
                        className="h-6 text-xs px-1"
                        autoFocus
                        onBlur={() => setEditingChannelId(null)}
                        onKeyDown={(e) => { if (e.key === "Escape") setEditingChannelId(null); }}
                      />
                    </form>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveChannel(ch)}
                        className={cn(
                          "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors min-w-0",
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
                      {isOwnerOrAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 mr-1 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => {
                              setEditingChannelId(ch.id);
                              setEditingChannelName(ch.name);
                            }}>
                              <Pencil className="w-3 h-3 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setChannelToDelete(ch)}
                            >
                              <Trash2 className="w-3 h-3 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  )}
                </div>
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
          <div className="w-56 border-l border-border/50 p-3 bg-card/50 overflow-y-auto">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Members — {members.length}
            </span>
            <div className="mt-2 space-y-1">
              {/* Group by role */}
              {["owner", "admin", "moderator", "member"].map((role) => {
                const roleMembers = members.filter((m) => m.role === role);
                if (roleMembers.length === 0) return null;
                return (
                  <div key={role}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mt-2 block">
                      {role === "owner" ? "👑 Owner" : role === "admin" ? "🛡️ Admin" : role === "moderator" ? "⚔️ Moderator" : "Members"}
                    </span>
                    {roleMembers.map((m) => (
                      <MemberItem
                        key={m.id}
                        member={m}
                        isOnline={isOnline(m.user_id)}
                        isOwnerOrAdmin={isOwnerOrAdmin}
                        currentUserId={user?.id}
                        communityOwnerId={community.owner_id}
                        onUpdateRole={updateMemberRole}
                        onKick={kickMember}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Member item with role management
const MemberItem = ({
  member,
  isOnline: online,
  isOwnerOrAdmin,
  currentUserId,
  communityOwnerId,
  onUpdateRole,
  onKick,
}: {
  member: CommunityMember;
  isOnline: boolean;
  isOwnerOrAdmin: boolean;
  currentUserId: string | undefined;
  communityOwnerId: string;
  onUpdateRole: (memberId: string, role: string) => Promise<void>;
  onKick: (memberId: string) => Promise<void>;
}) => {
  const isSelf = member.user_id === currentUserId;
  const isOwner = member.role === "owner";
  const canManage = isOwnerOrAdmin && !isSelf && !isOwner;
  const isCurrentUserOwner = currentUserId === communityOwnerId;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm group hover:bg-secondary/30 transition-colors">
      <div className="relative">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-medium">
          {member.profile?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
            online ? "bg-online" : "bg-offline"
          )}
        />
      </div>
      <span className="truncate flex-1">{member.profile?.username || "Unknown"}</span>
      {isOwner && <Crown className="w-3 h-3 text-warning shrink-0" />}
      {member.role === "admin" && <Shield className="w-3 h-3 text-primary shrink-0" />}
      {member.role === "moderator" && <ShieldCheck className="w-3 h-3 text-accent shrink-0" />}

      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {isCurrentUserOwner && member.role !== "admin" && (
              <DropdownMenuItem onClick={() => onUpdateRole(member.id, "admin")}>
                <Shield className="w-3 h-3 mr-2" /> Make Admin
              </DropdownMenuItem>
            )}
            {member.role !== "moderator" && (
              <DropdownMenuItem onClick={() => onUpdateRole(member.id, "moderator")}>
                <ShieldCheck className="w-3 h-3 mr-2" /> Make Moderator
              </DropdownMenuItem>
            )}
            {member.role !== "member" && (
              <DropdownMenuItem onClick={() => onUpdateRole(member.id, "member")}>
                <ShieldOff className="w-3 h-3 mr-2" /> Remove Role
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onKick(member.id)}
            >
              <UserMinus className="w-3 h-3 mr-2" /> Kick Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
      <AlertDialog open={!!channelToDelete} onOpenChange={(open) => !open && setChannelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">#{channelToDelete?.name}</span>? All messages in this channel will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (channelToDelete) {
                  if (activeChannel?.id === channelToDelete.id) setActiveChannel(null);
                  await deleteChannel(channelToDelete.id);
                  setChannelToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
