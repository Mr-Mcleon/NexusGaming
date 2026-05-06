import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown, Trash2, Eraser } from "lucide-react";
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

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("rls_verification_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: "Couldn't load history", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as Run[];

    // Resolve usernames
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
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  const removeRun = async (id: string) => {
    const { error } = await supabase.from("rls_verification_runs").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setRuns((prev) => prev.filter((r) => r.id !== id));
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
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && runs.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No runs recorded yet. Run the RLS verification suite above to populate history.
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border/60" />
            <div className="space-y-3">
              {runs.map((r, i) => {
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
                                onClick={() => removeRun(r.id)}
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
    </Card>
  );
}
