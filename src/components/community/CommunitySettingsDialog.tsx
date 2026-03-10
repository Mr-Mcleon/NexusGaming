import { useState } from "react";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Community } from "@/hooks/useCommunities";

const ICONS = ["🎮", "🏆", "⚔️", "🎯", "🚀", "💎", "🔥", "🎵", "🎨", "🌟"];

interface CommunitySettingsDialogProps {
  community: Community;
  onUpdated: () => void;
  onDeleted?: () => void;
  children: React.ReactNode;
}

export const CommunitySettingsDialog = ({
  community,
  onUpdated,
  onDeleted,
  children,
}: CommunitySettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [icon, setIcon] = useState(community.icon);
  const [isPublic, setIsPublic] = useState(community.is_public);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase
        .from("communities" as any)
        .update({
          name: name.trim(),
          description: description.trim(),
          icon,
          is_public: isPublic,
        } as any)
        .eq("id", community.id) as any);

      if (error) throw error;
      toast.success("Community settings updated!");
      onUpdated();
      setOpen(false);
    } catch (err) {
      console.error("Failed to update community:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(community.name);
      setDescription(community.description);
      setIcon(community.icon);
      setIsPublic(community.is_public);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Community Settings</DialogTitle>
          <DialogDescription>
            Edit your community's name, description, icon, and visibility.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Icon picker */}
          <div>
            <Label className="mb-2 block">Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === emoji
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Community name"
              maxLength={50}
            />
          </div>

          <div>
            <Label className="mb-2 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this community about?"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label>Public Community</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic
                  ? "Anyone can discover and join"
                  : "Only invited members can join"}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full"
            variant="gaming"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
