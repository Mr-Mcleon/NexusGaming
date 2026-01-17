import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Theme } from "@/contexts/ThemeContext";

interface ThemePreviewCardProps {
  themeId: Theme;
  name: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

// Theme color configurations for preview
const themeColors: Record<Theme, {
  bg: string;
  sidebar: string;
  primary: string;
  accent: string;
  card: string;
}> = {
  light: {
    bg: "bg-[#fafafa]",
    sidebar: "bg-white",
    primary: "bg-[#3b82f6]",
    accent: "bg-[#8b5cf6]",
    card: "bg-white/80",
  },
  cyber: {
    bg: "bg-[#0a0a14]",
    sidebar: "bg-[#12121c]",
    primary: "bg-[#00f0ff]",
    accent: "bg-[#bf00ff]",
    card: "bg-[#1a1a2e]/60",
  },
  midnight: {
    bg: "bg-[#0f1729]",
    sidebar: "bg-[#0a1020]",
    primary: "bg-[#3b82f6]",
    accent: "bg-[#fbbf24]",
    card: "bg-[#1e3a5f]/60",
  },
  sunset: {
    bg: "bg-[#1a0a0a]",
    sidebar: "bg-[#120808]",
    primary: "bg-[#f97316]",
    accent: "bg-[#ec4899]",
    card: "bg-[#2d1f1f]/60",
  },
  forest: {
    bg: "bg-[#0a140a]",
    sidebar: "bg-[#061006]",
    primary: "bg-[#22c55e]",
    accent: "bg-[#a3e635]",
    card: "bg-[#1a2e1a]/60",
  },
  ocean: {
    bg: "bg-[#0a1414]",
    sidebar: "bg-[#061212]",
    primary: "bg-[#06b6d4]",
    accent: "bg-[#0ea5e9]",
    card: "bg-[#1a2e2e]/60",
  },
  lavender: {
    bg: "bg-[#14101a]",
    sidebar: "bg-[#0e0a14]",
    primary: "bg-[#a855f7]",
    accent: "bg-[#f472b6]",
    card: "bg-[#2a1f3d]/60",
  },
};

export const ThemePreviewCard = ({
  themeId,
  name,
  description,
  isActive,
  onClick,
}: ThemePreviewCardProps) => {
  const colors = themeColors[themeId];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full rounded-xl p-1 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        isActive
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "ring-1 ring-border hover:ring-primary/50"
      )}
    >
      {/* Mini Preview UI */}
      <div className={cn("rounded-lg overflow-hidden", colors.bg)}>
        <div className="flex h-24">
          {/* Sidebar preview */}
          <div className={cn("w-8 p-1 flex flex-col gap-1", colors.sidebar, themeId === "light" ? "border-r border-gray-200" : "")}>
            <div className={cn("w-full h-3 rounded-sm", colors.primary, "opacity-80")} />
            <div className={cn("w-full h-2 rounded-sm", themeId === "light" ? "bg-gray-300" : "bg-white/10")} />
            <div className={cn("w-full h-2 rounded-sm", themeId === "light" ? "bg-gray-300" : "bg-white/10")} />
            <div className={cn("w-full h-2 rounded-sm", themeId === "light" ? "bg-gray-300" : "bg-white/10")} />
          </div>
          
          {/* Main content preview */}
          <div className="flex-1 p-2 space-y-2">
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div className={cn("h-2 w-12 rounded-sm", colors.primary, "opacity-60")} />
              <div className="flex gap-1">
                <div className={cn("w-2 h-2 rounded-full", colors.accent, "opacity-60")} />
                <div className={cn("w-2 h-2 rounded-full", themeId === "light" ? "bg-gray-300" : "bg-white/20")} />
              </div>
            </div>
            
            {/* Content cards */}
            <div className="flex gap-1">
              <div className={cn("flex-1 h-10 rounded", colors.card, themeId === "light" ? "border border-gray-200 shadow-sm" : "border border-white/5")} />
              <div className={cn("flex-1 h-10 rounded", colors.card, themeId === "light" ? "border border-gray-200 shadow-sm" : "border border-white/5")} />
            </div>
            
            {/* Bottom bar */}
            <div className="flex gap-1">
              <div className={cn("h-3 w-8 rounded-sm", colors.primary, "opacity-40")} />
              <div className={cn("h-3 w-6 rounded-sm", colors.accent, "opacity-40")} />
            </div>
          </div>
        </div>
      </div>

      {/* Theme info */}
      <div className="p-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{name}</h3>
          {isActive && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
};
