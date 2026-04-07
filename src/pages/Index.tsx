import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { HomeSection } from "@/components/sections/HomeSection";
import { LibrarySection } from "@/components/sections/LibrarySection";
import { StoreSection } from "@/components/sections/StoreSection";
import { CloudSection } from "@/components/sections/CloudSection";
import { SocialSection } from "@/components/sections/SocialSection";
import { DeveloperSection } from "@/components/sections/DeveloperSection";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendActivityAlerts } from "@/hooks/useFriendActivityAlerts";
import { useAchievementChecker } from "@/hooks/useAchievements";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

const SWIPE_TABS = ["home", "library", "store", "social"];

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [chatOpen, setChatOpen] = useState(false);
  const isMobile = useIsMobile();
  
  useAchievementChecker();
  useFriendActivityAlerts();

  const swipeLeft = useCallback(() => {
    const idx = SWIPE_TABS.indexOf(activeTab);
    if (idx >= 0 && idx < SWIPE_TABS.length - 1) setActiveTab(SWIPE_TABS[idx + 1]);
  }, [activeTab]);

  const swipeRight = useCallback(() => {
    const idx = SWIPE_TABS.indexOf(activeTab);
    if (idx > 0) setActiveTab(SWIPE_TABS[idx - 1]);
  }, [activeTab]);

  const swipeRef = useSwipeNavigation({
    onSwipeLeft: swipeLeft,
    onSwipeRight: swipeRight,
    enabled: isMobile,
  });

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeSection />;
      case "library":
        return <LibrarySection />;
      case "store":
        return <StoreSection />;
      case "cloud":
        return <CloudSection />;
      case "social":
        return <SocialSection />;
      case "developer":
        return <DeveloperSection />;
      case "downloads":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold mb-2">Downloads</h2>
              <p className="text-muted-foreground">Your active downloads will appear here</p>
            </div>
          </div>
        );
      case "achievements":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold mb-2">Achievements</h2>
              <p className="text-muted-foreground">Track your gaming achievements</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold mb-2">Settings</h2>
              <p className="text-muted-foreground">Configure your Nexus experience</p>
            </div>
          </div>
        );
      default:
        return <HomeSection />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Main Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />
        
        {/* Content */}
        <main className="flex-1 overflow-hidden relative pb-16 md:pb-0">
          {renderContent()}
          
          {/* Chat Toggle Button */}
          {!chatOpen && (
            <Button
              variant="gaming"
              size="icon"
              className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg z-40"
              onClick={() => setChatOpen(true)}
            >
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-background" />
            </Button>
          )}
        </main>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Index;
