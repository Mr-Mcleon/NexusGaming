import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCustomization, useSaveProfileCustomization, useUploadBanner } from "@/hooks/useProfileCustomization";
import { useGames } from "@/hooks/useGames";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Image, Palette, GripVertical, Link2, Gamepad2, Save, Loader2, X, Plus,
  Twitter, MessageCircle, Tv, Youtube, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

const ACCENT_COLORS = [
  "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444",
  "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#84CC16",
];

const SECTION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  games: { label: "Games Library", icon: <Gamepad2 className="w-4 h-4" /> },
  achievements: { label: "Achievements", icon: <span className="text-sm">🏆</span> },
  activity: { label: "Activity Feed", icon: <span className="text-sm">📡</span> },
};

const SOCIAL_PLATFORMS = [
  { key: "twitter", label: "Twitter / X", icon: <Twitter className="w-4 h-4" />, placeholder: "https://twitter.com/username" },
  { key: "discord", label: "Discord", icon: <MessageCircle className="w-4 h-4" />, placeholder: "username#1234" },
  { key: "twitch", label: "Twitch", icon: <Tv className="w-4 h-4" />, placeholder: "https://twitch.tv/username" },
  { key: "youtube", label: "YouTube", icon: <Youtube className="w-4 h-4" />, placeholder: "https://youtube.com/@channel" },
  { key: "steam", label: "Steam", icon: <Gamepad2 className="w-4 h-4" />, placeholder: "https://steamcommunity.com/id/..." },
];

export function ProfileCustomizationEditor() {
  const { user } = useAuth();
  const { data: customization, isLoading } = useProfileCustomization(user?.id);
  const saveCustomization = useSaveProfileCustomization();
  const uploadBanner = useUploadBanner();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { data: userGames } = useGames();

  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState("#8B5CF6");
  const [tagline, setTagline] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [sectionOrder, setSectionOrder] = useState(["games", "achievements", "activity"]);
  const [showGames, setShowGames] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [featuredGameIds, setFeaturedGameIds] = useState<string[]>([]);

  useEffect(() => {
    if (customization) {
      setBannerUrl(customization.banner_url);
      setAccentColor(customization.accent_color);
      setTagline(customization.tagline || "");
      setSocialLinks(customization.social_links as Record<string, string>);
      setSectionOrder(customization.section_order);
      setShowGames(customization.show_games);
      setShowAchievements(customization.show_achievements);
      setShowActivity(customization.show_activity);
      setFeaturedGameIds(customization.featured_game_ids);
    }
  }, [customization]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadBanner.mutateAsync(file);
    setBannerUrl(url);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setSectionOrder(newOrder);
  };

  const toggleFeaturedGame = (gameId: string) => {
    setFeaturedGameIds((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : prev.length < 4
          ? [...prev, gameId]
          : (toast.error("Max 4 featured games"), prev)
    );
  };

  const handleSave = () => {
    saveCustomization.mutate({
      banner_url: bannerUrl,
      accent_color: accentColor,
      tagline: tagline.trim() || null,
      featured_game_ids: featuredGameIds,
      social_links: socialLinks,
      section_order: sectionOrder,
      show_activity: showActivity,
      show_achievements: showAchievements,
      show_games: showGames,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const libraryGames = userGames || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Profile Banner</h2>
        </div>
        <div
          className="relative w-full h-32 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20 cursor-pointer group"
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerUrl ? (
            <>
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              <button
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setBannerUrl(null); }}
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {uploadBanner.isPending && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
        <p className="text-xs text-muted-foreground mt-2">Recommended: 1200×300px, max 5MB</p>
      </div>

      {/* Accent Color + Tagline */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Accent & Tagline</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Accent Color</Label>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: accentColor === color ? "white" : "transparent",
                    transform: accentColor === color ? "scale(1.2)" : "scale(1)",
                  }}
                  onClick={() => setAccentColor(color)}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. 'Grinding leaderboards since 2015'"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{tagline.length}/100</p>
          </div>
        </div>
      </div>

      {/* Section Order */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Section Order & Visibility</h2>
        </div>
        <div className="space-y-2">
          {sectionOrder.map((section, index) => {
            const info = SECTION_LABELS[section];
            const isVisible =
              section === "games" ? showGames :
              section === "achievements" ? showAchievements :
              showActivity;
            const toggle =
              section === "games" ? setShowGames :
              section === "achievements" ? setShowAchievements :
              setShowActivity;
            return (
              <div key={section} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="flex flex-col gap-0.5">
                  <button
                    disabled={index === 0}
                    onClick={() => moveSection(index, "up")}
                    className="p-0.5 hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === sectionOrder.length - 1}
                    onClick={() => moveSection(index, "down")}
                    className="p-0.5 hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {info?.icon}
                  <span className="text-sm font-medium">{info?.label || section}</span>
                </div>
                <Switch checked={isVisible} onCheckedChange={toggle} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Games */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Featured Games</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Select up to 4 games to showcase on your profile</p>
        {libraryGames.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games in your library yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {libraryGames.slice(0, 12).map((game: any) => {
              const isFeatured = featuredGameIds.includes(game.id);
              return (
                <Card
                  key={game.id}
                  className={`cursor-pointer overflow-hidden transition-all ${
                    isFeatured ? "ring-2 ring-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleFeaturedGame(game.id)}
                >
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {game.cover_image_url ? (
                      <img src={game.cover_image_url} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                    {isFeatured && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate">{game.title}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-medium">Social Links</h2>
        </div>
        <div className="space-y-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                {platform.icon}
              </div>
              <Input
                value={socialLinks[platform.key] || ""}
                onChange={(e) =>
                  setSocialLinks((prev) => ({ ...prev, [platform.key]: e.target.value }))
                }
                placeholder={platform.placeholder}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saveCustomization.isPending}
        className="w-full"
        variant="gaming"
      >
        {saveCustomization.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Profile Customization
          </>
        )}
      </Button>
    </div>
  );
}
