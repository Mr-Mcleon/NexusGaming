import { Search, MessageSquare, ChevronDown, Wifi, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { ThemeSelector } from "@/components/ThemeSelector";
import { toast } from "sonner";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Player";
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="h-14 md:h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-3 md:px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-9 md:h-11 pl-9 md:pl-12 pr-4 bg-secondary/50 border border-border/50 rounded-xl text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-secondary transition-all duration-200"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4 ml-2">
        {/* Connection Status - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg">
          <Wifi className="w-4 h-4 text-online" />
          <span className="text-sm text-muted-foreground">Online</span>
        </div>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Messages - hidden on small mobile */}
        <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-xl hover:bg-secondary transition-colors">
              <div className="relative">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm md:text-base">
                  {initial}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-online border-2 border-background rounded-full" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium">{username}</p>
                <p className="text-xs text-muted-foreground">Level 1</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/profile/${user?.id}`)} className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
