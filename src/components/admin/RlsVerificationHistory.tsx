import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown, Trash2, Eraser, Search, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "@/hooks/use-toast";
import { searchUserIdsCached, prewarmAdminUsernames, getCacheMetrics, subscribeCacheMetrics, type CacheMetrics } from "@/lib/usernameSearchCache";

type Outcome = "pass" | "fail" | "warn" | "pending" | "running";

interface RunResult {
  name: string;
  expectation: string;
  outcome: Outcome;
  detail: string;
}

interface Run {
  id: string;
  user_id: string;
  ran_as_admin: boolean;
  total_count: number;
  pass_count: number;
  fail_count: number;
  warn_count: number;
  overall: Outcome;
  results: RunResult[];
  created_at: string;
  username?: string | null;
}

const OUTCOME_META: Record<Outcome, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pass:    { color: "text-[hsl(var(--success))]", icon: CheckCircle2, label: "Pass" },
  fail:    { color: "text-destructive", icon: XCircle, label: "Fail" },
  warn:    { color: "text-[hsl(var(--warning))]", icon: AlertTriangle, label: "Warn" },
  pending: { color: "text-muted-foreground", icon: Loader2, label: "Pending" },
  running: { color: "text-primary", icon: Loader2, label: "Running" },
};

interface Props {
  refreshKey?: number;
}

export function RlsVerificationHistory({ refreshKey }: Props) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pass" | "fail" | "warn">("all");
  const [testFilter, setTestFilter] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [testOptions, setTestOptions] = useState<string[]>([]);
  const [prewarming, setPrewarming] = useState(false);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics>(() => getCacheMetrics());

  useEffect(() => {
    const unsub = subscribeCacheMetrics(setCacheMetrics);
    return () => { unsub(); };
  }, []);

  // Debounce username search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(userQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  // Load distinct test names from a sample of recent runs (independent of filters)
  const loadTestOptions = async () => {
    const { data } = await supabase
      .from("rls_verification_runs")
      .select("results")
      .order("created_at", { ascending: false })
      .limit(50);
    const set = new Set<string>();
    (data ?? []).forEach((row: any) => {
      (row.results as RunResult[] | null)?.forEach((res) => set.add(res.name));
    });
    setTestOptions(Array.from(set).sort());
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // Resolve username search → matching user_ids via indexed RPC (with short TTL cache)
    let userIdMatches: string[] | null = null;
    const q = debouncedQuery;
    const looksLikeUuid = /^[0-9a-f-]{4,}$/i.test(q);
    if (q) {
      userIdMatches = await searchUserIdsCached(q);
    }

    let query = supabase
      .from("rls_verification_runs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50);

    // Username/UUID filter (DB-side)
    if (q) {
      const ids = userIdMatches ?? [];
      if (looksLikeUuid && ids.length === 0) {
        query = query.eq("user_id", q);
      } else if (looksLikeUuid) {
        query = query.in("user_id", Array.from(new Set([...ids, q])));
      } else if (ids.length > 0) {
        query = query.in("user_id", ids);
      } else {
        // No matches — short-circuit
        setRuns([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
    }

    // Status filter (DB-side)
    if (statusFilter === "pass") {
      query = query.eq("fail_count", 0).eq("warn_count", 0).gt("pass_count", 0);
    } else if (statusFilter === "fail") {
      query = query.gt("fail_count", 0);
    } else if (statusFilter === "warn") {
      query = query.gt("warn_count", 0);
    }

    // Test type filter (DB-side via jsonb contains)
    if (testFilter !== "all") {
      query = query.contains("results", [{ name: testFilter }]);
    }

    const { data, error, count } = await query;

    if (error) {
      toast({ title: "Couldn't load history", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as Run[];

    // Resolve usernames for display
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);
      const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p.username]));
      rows.forEach((r) => (r.username = map.get(r.user_id) ?? null));
    }

    setRuns(rows);
    setTotalCount(count ?? rows.length);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey, debouncedQuery, statusFilter, testFilter]);

  useEffect(() => {
    if (user) {
      loadTestOptions();
      // Prewarm cache so admin username searches resolve instantly
      setPrewarming(true);
      prewarmAdminUsernames().finally(() => setPrewarming(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  const removeRun = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("rls_verification_runs").delete().eq("id", id);
    setDeleting(false);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setRuns((prev) => prev.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
    toast({ title: "Run deleted", description: "Verification run removed from history." });
  };

  const clearAllRuns = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("rls_verification_runs")
      .delete()
      .gte("created_at", "1970-01-01");
    setDeleting(false);
    if (error) {
      toast({ title: "Clear failed", description: error.message, variant: "destructive" });
      return;
    }
    setRuns([]);
    setConfirmClearAll(false);
    toast({ title: "History cleared", description: "All verification runs were removed." });
  };

  const targetRun = runs.find((r) => r.id === confirmDeleteId);

  // Filtering happens DB-side; results returned are already filtered
  const filteredRuns = runs;

  const filtersActive = userQuery !== "" || statusFilter !== "all" || testFilter !== "all";
  const clearFilters = () => {
    setUserQuery("");
    setStatusFilter("all");
    setTestFilter("all");
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Verification Run History
            </CardTitle>
            <CardDescription>
              {isAdmin ? "All users' past RLS verification runs" : "Your past RLS verification runs"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && runs.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmClearAll(true)}
                disabled={loading || deleting}
              >
                <Eraser className="w-4 h-4 mr-2" />
                Clear all
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(runs.length > 0 || filtersActive || testOptions.length > 0) && (
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search by username or user id..."
                className="pl-8 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pass">Pass only</SelectItem>
                <SelectItem value="fail">Has failures</SelectItem>
                <SelectItem value="warn">Has warnings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={testFilter} onValueChange={setTestFilter}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Test type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tests</SelectItem>
                {testOptions.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="h-9"
            >
              <FilterX className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        )}

        {prewarming && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Prewarming username cache…
          </div>
        )}

        {filtersActive && !loading && (
          <p className="text-xs text-muted-foreground mb-2">
            Showing {runs.length} matching run{runs.length === 1 ? "" : "s"}
          </p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {filtersActive
              ? "No runs match the current filters."
              : "No runs recorded yet. Run the RLS verification suite above to populate history."}
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border/60" />
            <div className="space-y-3">
              {filteredRuns.map((r, i) => {
                const meta = OUTCOME_META[r.overall];
                const Icon = meta.icon;
                const isOpen = openId === r.id;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="relative pl-9"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-1.5 top-3 w-3 h-3 rounded-full ring-2 ring-background ${
                      r.overall === "pass" ? "bg-[hsl(var(--success))]" :
                      r.overall === "fail" ? "bg-destructive" :
                      r.overall === "warn" ? "bg-[hsl(var(--warning))]" : "bg-muted-foreground"
                    }`} />

                    <Collapsible open={isOpen} onOpenChange={(o) => setOpenId(o ? r.id : null)}>
                      <div className="rounded-md border border-border/40 bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.color}`}>
                                <Icon className="w-3.5 h-3.5" />
                                {meta.label}
                              </span>
                              <Badge variant="outline" className="text-[10px] py-0">
                                {r.ran_as_admin ? "admin" : "non-admin"}
                              </Badge>
                              <span className="text-xs font-mono text-muted-foreground truncate">
                                {r.username ?? r.user_id.slice(0, 8)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(r.created_at).toLocaleString()} · {r.pass_count}/{r.total_count} passed
                              {r.fail_count > 0 && ` · ${r.fail_count} failed`}
                              {r.warn_count > 0 && ` · ${r.warn_count} warn`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setConfirmDeleteId(r.id)}
                                disabled={deleting}
                                aria-label="Delete run"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <CollapsibleTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7">
                                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        <CollapsibleContent className="mt-3 pt-3 border-t border-border/30 space-y-2">
                          {r.results.map((res, j) => {
                            const m = OUTCOME_META[res.outcome];
                            const I = m.icon;
                            return (
                              <div key={j} className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium">{res.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{res.expectation}</p>
                                  <p className={`text-[11px] mt-0.5 ${m.color}`}>{res.detail}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-medium shrink-0 ${m.color}`}>
                                  <I className="w-3 h-3" />
                                  {m.label}
                                </span>
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this verification run?</AlertDialogTitle>
            <AlertDialogDescription>
              {targetRun ? (
                <>
                  This will permanently remove the run from{" "}
                  <span className="font-mono">{targetRun.username ?? targetRun.user_id.slice(0, 8)}</span>{" "}
                  recorded on {new Date(targetRun.created_at).toLocaleString()}. This cannot be undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); if (confirmDeleteId) removeRun(confirmDeleteId); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all verification history?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-semibold">all {runs.length}</span> verification runs
              for every user. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); clearAllRuns(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Clearing..." : "Clear all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
