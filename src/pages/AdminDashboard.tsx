import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Database, Radio, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

type Status = "checking" | "healthy" | "degraded" | "down";

interface Check {
  label: string;
  status: Status;
  detail: string;
  latencyMs?: number;
}

const STATUS_META: Record<Status, { color: string; icon: typeof CheckCircle2; label: string }> = {
  checking: { color: "text-muted-foreground", icon: Loader2, label: "Checking" },
  healthy:  { color: "text-[hsl(var(--success))]", icon: CheckCircle2, label: "Healthy" },
  degraded: { color: "text-[hsl(var(--warning))]", icon: AlertTriangle, label: "Degraded" },
  down:     { color: "text-destructive", icon: XCircle, label: "Down" },
};

// Tables we expect from recent migrations
const EXPECTED_TABLES = [
  { name: "profiles", migration: "Initial schema" },
  { name: "user_settings", migration: "Cross-device sync" },
  { name: "communities", migration: "Communities (pending)" },
  { name: "profile_customization", migration: "Profile customization (pending)" },
] as const;

interface MigrationCheck {
  name: string;
  migration: string;
  exists: boolean;
  error?: string;
}

const StatusPill = ({ status }: { status: Status }) => {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.color}`}>
      <Icon className={`w-3.5 h-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
      {meta.label}
    </span>
  );
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [backend, setBackend] = useState<Check>({ label: "Database ping", status: "checking", detail: "Querying profiles..." });
  const [authCheck, setAuthCheck] = useState<Check>({ label: "Auth service", status: "checking", detail: "Reading session..." });
  const [realtime, setRealtime] = useState<Check>({ label: "Realtime channel", status: "checking", detail: "Opening socket..." });
  const [migrations, setMigrations] = useState<MigrationCheck[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = async () => {
    setRefreshing(true);
    setBackend({ label: "Database ping", status: "checking", detail: "Querying profiles..." });
    setAuthCheck({ label: "Auth service", status: "checking", detail: "Reading session..." });
    setRealtime({ label: "Realtime channel", status: "checking", detail: "Opening socket..." });
    setMigrations([]);

    // 1. Database ping
    const dbStart = performance.now();
    try {
      const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      const latency = Math.round(performance.now() - dbStart);
      if (error) {
        setBackend({ label: "Database ping", status: "down", detail: error.message, latencyMs: latency });
      } else {
        setBackend({
          label: "Database ping",
          status: latency > 1500 ? "degraded" : "healthy",
          detail: latency > 1500 ? "Slow response — backend may be cold" : "Backend responding normally",
          latencyMs: latency,
        });
      }
    } catch (e) {
      setBackend({ label: "Database ping", status: "down", detail: (e as Error).message });
    }

    // 2. Auth check
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthCheck({ label: "Auth service", status: "down", detail: error.message });
      } else {
        setAuthCheck({
          label: "Auth service",
          status: "healthy",
          detail: data.session ? `Session active for ${data.session.user.email ?? "user"}` : "No active session",
        });
      }
    } catch (e) {
      setAuthCheck({ label: "Auth service", status: "down", detail: (e as Error).message });
    }

    // 3. Migration / table existence checks
    const results = await Promise.all(
      EXPECTED_TABLES.map(async (t) => {
        const { error } = await supabase.from(t.name as any).select("*", { count: "exact", head: true });
        // 42P01 = undefined_table; PGRST205 = relation not found via PostgREST
        const missing = error && /(does not exist|not find|42P01|PGRST205)/i.test(`${error.code} ${error.message}`);
        return {
          name: t.name,
          migration: t.migration,
          exists: !missing,
          error: missing ? "Table not found" : error?.message,
        } as MigrationCheck;
      })
    );
    setMigrations(results);

    // 4. Realtime
    const channel = supabase.channel(`admin-health-${Date.now()}`);
    const timeout = setTimeout(() => {
      setRealtime({ label: "Realtime channel", status: "degraded", detail: "Subscribe timed out after 5s" });
      supabase.removeChannel(channel);
    }, 5000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        setRealtime({ label: "Realtime channel", status: "healthy", detail: "Websocket subscribed successfully" });
        setTimeout(() => supabase.removeChannel(channel), 500);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        clearTimeout(timeout);
        setRealtime({ label: "Realtime channel", status: "down", detail: `Channel status: ${status}` });
      }
    });

    setLastRun(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const checks = [
    { ...backend, icon: Database },
    { ...authCheck, icon: ShieldCheck },
    { ...realtime, icon: Radio },
  ];

  const overallStatus: Status =
    checks.some((c) => c.status === "down") ? "down" :
    checks.some((c) => c.status === "degraded") ? "degraded" :
    checks.every((c) => c.status === "healthy") ? "healthy" : "checking";

  const missingMigrations = migrations.filter((m) => !m.exists);

  return (
    <div className="min-h-screen bg-background">
      <ScrollArea className="h-screen">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4 flex-wrap"
          >
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Activity className="w-7 h-7 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Cloud backend health, migration status, and realtime diagnostics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={overallStatus} />
              <Button variant="outline" size="sm" onClick={runChecks} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Re-run checks
              </Button>
            </div>
          </motion.div>

          {lastRun && (
            <p className="text-xs text-muted-foreground">
              Last run: {lastRun.toLocaleTimeString()}
            </p>
          )}

          {/* Health checks */}
          <div className="grid gap-4 sm:grid-cols-3">
            {checks.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          {c.label}
                        </CardTitle>
                        <StatusPill status={c.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{c.detail}</p>
                      {c.latencyMs !== undefined && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Latency: <span className="font-mono">{c.latencyMs}ms</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Migration status */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Migration Status
                  </CardTitle>
                  <CardDescription>
                    Existence of expected tables from recent migrations
                  </CardDescription>
                </div>
                {migrations.length > 0 && (
                  <Badge variant={missingMigrations.length === 0 ? "default" : "destructive"}>
                    {migrations.length - missingMigrations.length}/{migrations.length} applied
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {migrations.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking migrations...
                </div>
              ) : (
                <div className="space-y-2">
                  {migrations.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-mono truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.migration}</p>
                      </div>
                      {m.exists ? (
                        <Badge variant="outline" className="gap-1 text-[hsl(var(--success))] border-[hsl(var(--success))]/40">
                          <CheckCircle2 className="w-3 h-3" /> Present
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" /> Missing
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {missingMigrations.length > 0 && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive">
                    {missingMigrations.length} migration{missingMigrations.length > 1 ? "s" : ""} pending. Run them via the migration tool to enable related features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
