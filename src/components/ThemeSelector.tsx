import { useTheme, Theme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";

const themeColors: Record<Theme, string> = {
  cyber: "bg-cyan-500",
  midnight: "bg-amber-400",
  sunset: "bg-orange-500",
  forest: "bg-emerald-500",
  ocean: "bg-blue-500",
  lavender: "bg-purple-400",
};

export const ThemeSelector = () => {
  const { theme, setTheme, themes } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="w-5 h-5" />
          <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${themeColors[theme]}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-4 h-4 rounded-full ${themeColors[t.id]}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            {theme === t.id && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
