import { useState, useEffect } from "react";
import { Copy, Link2, Plus, Trash2, Clock, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommunityInvites, getInviteUrl, type CommunityInvite } from "@/hooks/useCommunityInvites";
import { cn } from "@/lib/utils";

interface InviteDialogProps {
  communityId: string;
  communityName: string;
  children: React.ReactNode;
}

export const InviteDialog = ({ communityId, communityName, children }: InviteDialogProps) => {
  const { invites, loading, fetchInvites, createInvite, revokeInvite } = useCommunityInvites(communityId);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState<string>("unlimited");
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchInvites();
  }, [open, fetchInvites]);

  const handleCreate = async () => {
    setCreating(true);
    const options: { maxUses?: number; expiresInHours?: number } = {};
    if (maxUses !== "unlimited") options.maxUses = parseInt(maxUses);
    if (expiresIn !== "never") options.expiresInHours = parseInt(expiresIn);
    await createInvite(options);
    setCreating(false);
  };

  const handleCopy = async (invite: CommunityInvite) => {
    const url = getInviteUrl(invite.invite_code);
    await navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return "Never";
    const date = new Date(expiresAt);
    if (date < new Date()) return "Expired";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Invite to {communityName}
          </DialogTitle>
          <DialogDescription>
            Create invite links to share with friends.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new invite */}
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
            <div className="flex gap-2">
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger className="flex-1">
                  <Clock className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={maxUses} onValueChange={setMaxUses}>
                <SelectTrigger className="flex-1">
                  <Users className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Unlimited uses</SelectItem>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                  <SelectItem value="25">25 uses</SelectItem>
                  <SelectItem value="100">100 uses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full" size="sm">
              <Plus className="w-4 h-4" />
              {creating ? "Creating..." : "Generate Invite Link"}
            </Button>
          </div>

          {/* Existing invites */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Invites
              </span>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"
                >
                  <div className="flex-1 min-w-0">
                    <Input
                      readOnly
                      value={getInviteUrl(invite.invite_code)}
                      className="text-xs h-8 bg-transparent border-none cursor-text"
                    />
                    <div className="flex gap-3 px-3 text-xs text-muted-foreground">
                      <span>{invite.uses}{invite.max_uses ? `/${invite.max_uses}` : ""} uses</span>
                      <span>Expires: {formatExpiry(invite.expires_at)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 w-8 h-8"
                    onClick={() => handleCopy(invite)}
                  >
                    {copiedId === invite.id ? (
                      <Check className="w-4 h-4 text-online" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 w-8 h-8 text-destructive hover:text-destructive"
                    onClick={() => revokeInvite(invite.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {invites.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-2">
              No active invite links. Create one above!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
