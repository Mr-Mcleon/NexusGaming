import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Bell, Camera, Loader2, Mail, Save, User, Volume2, ShieldOff, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useBlockedUsers, useUnblockUser } from "@/hooks/useBlockedUsers";
import { useEmailPreferences } from "@/hooks/useEmailPreferences";
import { useQuery } from "@tanstack/react-query";

interface Profile {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, desktopEnabled, setSoundEnabled, setDesktopEnabled } = useNotificationSettings();
  const { saleEmailEnabled, setSaleEmailEnabled, isPending: emailPending } = useEmailPreferences();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    username: "",
    avatar_url: null,
    bio: "",
  });

  // Blocked users
  const { data: blockedUsers = [], isLoading: blockedLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  // Fetch profiles for blocked users
  const { data: blockedProfiles = [] } = useQuery({
    queryKey: ["blocked-profiles", blockedUsers.map(b => b.blocked_user_id)],
    queryFn: async () => {
      if (blockedUsers.length === 0) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", blockedUsers.map(b => b.blocked_user_id));

      if (error) throw error;
      return data || [];
    },
    enabled: blockedUsers.length > 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username, avatar_url, bio")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } else if (data) {
      setProfile({
        username: data.username || "",
        avatar_url: data.avatar_url,
        bio: data.bio || "",
      });
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if any
      await supabase.storage.from("avatars").remove([filePath]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache busting
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success("Avatar updated!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate username
    if (!profile.username?.trim()) {
      toast.error("Username is required");
      return;
    }

    if (profile.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (profile.username.length > 30) {
      toast.error("Username must be less than 30 characters");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username.trim(),
          bio: profile.bio?.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
        </div>

        {/* Avatar Section */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-4">Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Click on your avatar to upload a new image.
                <br />
                Max size: 2MB. Recommended: 256x256px.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                This is how other users will see you.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {(profile.bio?.length || 0)}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings Section */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sound-toggle" className="cursor-pointer">Sound Effects</Label>
                  <p className="text-xs text-muted-foreground">
                    Play a sound for new messages and friend requests
                  </p>
                </div>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="desktop-toggle" className="cursor-pointer">Desktop Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Show browser notifications when you receive alerts
                  </p>
                </div>
              </div>
              <Switch
                id="desktop-toggle"
                checked={desktopEnabled}
                onCheckedChange={setDesktopEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-toggle" className="cursor-pointer">Sale Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive emails when wishlisted games go on sale
                  </p>
                </div>
              </div>
              <Switch
                id="email-toggle"
                checked={saleEmailEnabled}
                onCheckedChange={setSaleEmailEnabled}
                disabled={emailPending}
              />
            </div>
          </div>
        </div>

        {/* Blocked Users Section */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldOff className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-medium">Blocked Users</h2>
          </div>
          
          {blockedLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                You haven't blocked any users
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((blocked) => {
                const profile = blockedProfiles.find(p => p.user_id === blocked.blocked_user_id);
                return (
                  <div 
                    key={blocked.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20">
                          {profile?.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile?.username || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground">
                          Blocked on {new Date(blocked.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unblockUser.mutate(blocked.blocked_user_id)}
                      disabled={unblockUser.isPending}
                    >
                      {unblockUser.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Unblock"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
          variant="gaming"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
