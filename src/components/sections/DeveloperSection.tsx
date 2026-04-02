import { useState, useEffect } from "react";
import { 
  Users, Database, Activity, Settings2, RefreshCw, 
  TrendingUp, HardDrive, Clock, ToggleLeft, ToggleRight,
  Terminal, AlertTriangle, CheckCircle, Info, Search, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

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

interface ConfigOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const DeveloperSection = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [dbStats, setDbStats] = useState<{ table: string; count: number }[]>([]);
  const [dbFilter, setDbFilter] = useState("");
  const [dbSort, setDbSort] = useState<{ key: "table" | "count"; dir: "asc" | "desc" }>({ key: "table", dir: "asc" });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<ConfigOption[]>([
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

      // Generate mock activity logs from real data
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

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const toggleConfig = (id: string) => {
    setConfig(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "error": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />;
      case "success": return <CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
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
        {/* Header */}
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
            <TabsTrigger value="stats">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="database">
              <HardDrive className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Clock className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings2 className="w-4 h-4 mr-2" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2"><div className="h-4 w-24 bg-muted rounded" /></CardHeader>
                    <CardContent><div className="h-8 w-16 bg-muted rounded" /></CardContent>
                  </Card>
                ))
              ) : (
                stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription className="text-xs font-medium">{stat.title}</CardDescription>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold font-display">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                          {stat.trend && (
                            <span className="text-[hsl(var(--success))] ml-2">{stat.trend}</span>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="mt-6 space-y-4">
            {/* Bar Chart */}
            {!loading && dbStats.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Row Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dbStats.filter(r => r.count > 0).sort((a, b) => b.count - a.count)} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                      <XAxis dataKey="table" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Table List */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Table Overview</CardTitle>
                <CardDescription>Row counts for key database tables</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter tables..."
                      value={dbFilter}
                      onChange={(e) => setDbFilter(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() =>
                      setDbSort((prev) =>
                        prev.key === "table"
                          ? prev.dir === "asc" ? { key: "table", dir: "desc" } : { key: "count", dir: "desc" }
                          : prev.dir === "desc" ? { key: "count", dir: "asc" } : { key: "table", dir: "asc" }
                      )
                    }
                  >
                    {dbSort.key === "table" ? (
                      <>Name {dbSort.dir === "asc" ? <ArrowUp className="w-3.5 h-3.5 ml-1" /> : <ArrowDown className="w-3.5 h-3.5 ml-1" />}</>
                    ) : (
                      <>Rows {dbSort.dir === "desc" ? <ArrowDown className="w-3.5 h-3.5 ml-1" /> : <ArrowUp className="w-3.5 h-3.5 ml-1" />}</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center py-2 animate-pulse">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-12 bg-muted rounded" />
                      </div>
                    ))
                  ) : (
                    dbStats
                      .filter((row) => row.table.toLowerCase().includes(dbFilter.toLowerCase()))
                      .sort((a, b) => {
                        const mul = dbSort.dir === "asc" ? 1 : -1;
                        if (dbSort.key === "table") return mul * a.table.localeCompare(b.table);
                        return mul * (a.count - b.count);
                      })
                      .map((row) => (
                        <div key={row.table} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{row.table}</span>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            {row.count.toLocaleString()} rows
                          </Badge>
                        </div>
                      ))
                  )}
                  {!loading && dbStats.filter((row) => row.table.toLowerCase().includes(dbFilter.toLowerCase())).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tables match "{dbFilter}"</p>
                  )}
                </div>
                {!loading && dbStats.length > 0 && (
                  <div className="flex justify-between items-center pt-4 mt-3 border-t border-border">
                    <span className="text-sm font-medium text-muted-foreground">{dbStats.length} tables</span>
                    <Badge className="font-mono">
                      {dbStats.reduce((sum, r) => sum + r.count, 0).toLocaleString()} total rows
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Activity Logs</CardTitle>
                <CardDescription>Recent system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
                        <div className="w-4 h-4 bg-muted rounded-full" />
                        <div className="h-4 flex-1 bg-muted rounded" />
                      </div>
                    ))
                  ) : logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity logs</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                        {getLogIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm capitalize">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">
                          {log.type}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="mt-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">App Configuration</CardTitle>
                <CardDescription>Toggle features and system settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {config.map((option) => (
                    <div key={option.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        {option.enabled ? (
                          <ToggleRight className="w-5 h-5 text-primary" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <Label htmlFor={option.id} className="cursor-pointer font-medium">{option.label}</Label>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                      <Switch
                        id={option.id}
                        checked={option.enabled}
                        onCheckedChange={() => toggleConfig(option.id)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
