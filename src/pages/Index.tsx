import { useState } from "react";
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

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [chatOpen, setChatOpen] = useState(false);
  
  // Check for achievement unlocks
  useAchievementChecker();
  
  // Listen for friend activity and show alerts
  useFriendActivityAlerts();

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
        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
          
          {/* Chat Toggle Button */}
          {!chatOpen && (
            <Button
              variant="gaming"
              size="icon"
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
              onClick={() => setChatOpen(true)}
            >
              <MessageSquare className="w-6 h-6" />
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
