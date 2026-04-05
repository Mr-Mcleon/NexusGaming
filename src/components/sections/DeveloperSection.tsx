import { useState, useEffect } from "react";
import { Users, Database, Activity, RefreshCw, TrendingUp, HardDrive, Clock, Settings2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatsTab } from "@/components/developer/StatsTab";
import { DatabaseTab } from "@/components/developer/DatabaseTab";
import { LogsTab } from "@/components/developer/LogsTab";
import { ConfigTab } from "@/components/developer/ConfigTab";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: string;
}

interface LogEntry {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
}

export const DeveloperSection = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [dbStats, setDbStats] = useState<{ table: string; count: number }[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState([
    { id: "maintenance", label: "Maintenance Mode", description: "Show maintenance page to all users", enabled: false },
    { id: "debug", label: "Debug Mode", description: "Enable verbose console logging", enabled: false },
    { id: "notifications", label: "Push Notifications", description: "Enable push notification system", enabled: true },
    { id: "realtime", label: "Realtime Updates", description: "Enable live data syncing", enabled: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const tableNames = [
        "profiles", "games", "activity_feed", "achievements", "user_achievements",
        "user_library", "friendships", "blocked_users", "conversations", "messages",
        "cloud_clips", "game_reviews", "game_screenshots", "sale_notifications",
        "user_settings", "wishlist", "wishlist_price_alerts", "wishlist_shares",
        "conversation_participants", "typing_indicators",
      ] as const;

      const results = await Promise.all(
        tableNames.map(t => supabase.from(t).select("id", { count: "exact", head: true }))
      );

      const tableCounts = tableNames.map((name, i) => ({ table: name, count: results[i].count ?? 0 }));
      setDbStats(tableCounts);

      const countFor = (name: string) => tableCounts.find(t => t.table === name)?.count ?? 0;

      setStats([
        { title: "Total Users", value: countFor("profiles"), icon: Users, description: "Registered accounts", trend: "+12%" },
        { title: "Games", value: countFor("games"), icon: Database, description: "In catalog", trend: "+5%" },
        { title: "Activities", value: countFor("activity_feed"), icon: Activity, description: "Feed entries", trend: "+23%" },
      ]);

      const { data: recentActivity } = await supabase
        .from("activity_feed")
        .select("id, activity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentActivity) {
        setLogs(recentActivity.map(a => ({
          id: a.id,
          type: a.activity_type === "game_launch" ? "info" as const :
                a.activity_type === "achievement_unlock" ? "success" as const :
                a.activity_type === "purchase" ? "warning" as const : "info" as const,
          message: `${a.activity_type.replace(/_/g, " ")} event recorded`,
          timestamp: a.created_at,
        })));
      }
    } catch (err) {
      console.error("Failed to fetch dev stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchStats(); };
  const toggleConfig = (id: string) => {
    setConfig(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Sign in to access the developer dashboard.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Terminal className="w-6 h-6 text-primary" />
              Developer Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">System overview and configuration</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats"><TrendingUp className="w-4 h-4 mr-2" />Stats</TabsTrigger>
            <TabsTrigger value="database"><HardDrive className="w-4 h-4 mr-2" />Database</TabsTrigger>
            <TabsTrigger value="logs"><Clock className="w-4 h-4 mr-2" />Logs</TabsTrigger>
            <TabsTrigger value="config"><Settings2 className="w-4 h-4 mr-2" />Config</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-6">
            <StatsTab stats={stats} loading={loading} />
          </TabsContent>
          <TabsContent value="database" className="mt-6">
            <DatabaseTab dbStats={dbStats} loading={loading} />
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <LogsTab logs={logs} loading={loading} />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <ConfigTab config={config} onToggle={toggleConfig} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
