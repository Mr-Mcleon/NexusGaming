import { useState } from "react";
import { 
  Gamepad2, 
  Store, 
  Library, 
  Cloud, 
  Users, 
  Settings, 
  Download,
  Trophy,
  Zap,
  Code2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  id: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Gamepad2, label: "Home", id: "home" },
  { icon: Library, label: "Library", id: "library" },
  { icon: Store, label: "Store", id: "store" },
  { icon: Cloud, label: "Cloud", id: "cloud" },
  { icon: Users, label: "Social", id: "social", badge: 3 },
  { icon: Download, label: "Downloads", id: "downloads", badge: 2 },
  { icon: Trophy, label: "Achievements", id: "achievements" },
  { icon: Code2, label: "Developer", id: "developer" },
];

// Subset for mobile bottom nav
const mobileNavItems = navItems.filter(item => 
  ["home", "library", "store", "social"].includes(item.id)
);

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const moreItems: NavItem[] = [
  { icon: Cloud, label: "Cloud", id: "cloud" },
  { icon: Download, label: "Downloads", id: "downloads", badge: 2 },
  { icon: Trophy, label: "Achievements", id: "achievements" },
  { icon: Code2, label: "Developer", id: "developer" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <aside 
        className={cn(
          "hidden md:flex flex-col h-full bg-sidebar border-r border-border/50 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow-pulse">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display text-lg font-bold gradient-text">NEXUS</h1>
              <p className="text-xs text-muted-foreground">Gaming Hub</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-gaming">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                )} />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {item.badge && !collapsed && (
                  <span className="ml-auto bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.badge && collapsed && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="p-3 border-t border-border/50">
          <button
            onClick={() => onTabChange("settings")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
              activeTab === "settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Settings</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors relative min-w-[4rem]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-1 right-2 w-2 h-2 bg-accent rounded-full" />
                )}
              </button>
            );
          })}
          {/* More menu drawer trigger */}
          <button
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[4rem]",
              moreItems.some(i => i.id === activeTab)
                ? "text-primary"
                : "text-muted-foreground"
            )}
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More items drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <DrawerClose asChild key={item.id}>
                  <button
                    onClick={() => { onTabChange(item.id); setMoreOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]")} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </DrawerClose>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
