import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gamepad2, Trophy, Clock, Share2, Download, Copy, Check,
  Twitter, MessageCircle, Tv, Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { SocialLinks } from "@/hooks/useProfileCustomization";

interface ProfileCardProps {
  username: string;
  avatarUrl?: string | null;
  tagline?: string | null;
  accentColor: string;
  bannerUrl?: string | null;
  gamesCount: number;
  achievementsCount: number;
  playtimeHours: number;
  socialLinks?: SocialLinks;
  userId: string;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter: <Twitter className="w-3.5 h-3.5" />,
  discord: <MessageCircle className="w-3.5 h-3.5" />,
  twitch: <Tv className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  steam: <Gamepad2 className="w-3.5 h-3.5" />,
};

export function ProfileCard({
  username, avatarUrl, tagline, accentColor, bannerUrl,
  gamesCount, achievementsCount, playtimeHours, socialLinks, userId,
}: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/profile/${userId}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${username}'s Profile`, url: profileUrl });
    } else {
      handleCopyLink();
    }
  };

  const activeSocials = Object.entries(socialLinks || {}).filter(([, v]) => v);

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-border shadow-xl"
        style={{ background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)` }}
      >
        {/* Banner */}
        <div
          className="h-20 w-full"
          style={{
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover`
              : `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
          }}
        />

        {/* Avatar */}
        <div className="px-4 -mt-10 relative z-10">
          <Avatar className="w-20 h-20 border-4 rounded-xl" style={{ borderColor: accentColor }}>
            <AvatarImage src={avatarUrl || undefined} className="object-cover" />
            <AvatarFallback className="rounded-xl text-2xl font-bold bg-secondary">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="px-4 pt-2 pb-4">
          <h3 className="font-display text-lg font-bold">{username}</h3>
          {tagline && (
            <p className="text-xs text-muted-foreground italic mb-2">"{tagline}"</p>
          )}

          {/* Stats */}
          <div className="flex gap-4 my-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gamepad2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span className="font-medium">{gamesCount}</span> games
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span className="font-medium">{achievementsCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span className="font-medium">{playtimeHours}h</span>
            </div>
          </div>

          {/* Social Links */}
          {activeSocials.length > 0 && (
            <div className="flex gap-2 mb-2">
              {activeSocials.map(([key, url]) => (
                <a
                  key={key}
                  href={url?.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
                  title={key}
                >
                  {SOCIAL_ICONS[key]}
                </a>
              ))}
            </div>
          )}

          {/* Branding */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/60 text-center">GameVault Player Card</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-center max-w-sm mx-auto">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyLink}>
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
}
