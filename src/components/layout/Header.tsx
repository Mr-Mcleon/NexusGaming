import { Search, Bell, MessageSquare, ChevronDown, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search games, friends, or communities..."
            className="w-full h-11 pl-12 pr-4 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-secondary transition-all duration-200"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg">
          <Wifi className="w-4 h-4 text-online" />
          <span className="text-sm text-muted-foreground">Online</span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </Button>

        {/* Messages */}
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* User Profile */}
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary transition-colors">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
              N
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online border-2 border-background rounded-full" />
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-medium">NexusPlayer</p>
            <p className="text-xs text-muted-foreground">Level 42</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
        </button>
      </div>
    </header>
  );
};
