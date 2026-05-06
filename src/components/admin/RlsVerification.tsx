import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Loader2, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Outcome = "pass" | "fail" | "warn" | "pending" | "running";

interface TestResult {
  name: string;
  expectation: string;
  outcome: Outcome;
  detail: string;
}

const OUTCOME_META: Record<Outcome, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pass:    { color: "text-[hsl(var(--success))]", icon: CheckCircle2, label: "Pass" },
  fail:    { color: "text-destructive", icon: XCircle, label: "Fail" },
  warn:    { color: "text-[hsl(var(--warning))]", icon: AlertTriangle, label: "Warn" },
  pending: { color: "text-muted-foreground", icon: Loader2, label: "Pending" },
  running: { color: "text-primary", icon: Loader2, label: "Running" },
};

const FAKE_UUID = "00000000-0000-0000-0000-000000000001";

interface RlsVerificationProps {
  onRunSaved?: () => void;
}

export function RlsVerification({ onRunSaved }: RlsVerificationProps = {}) {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const run = async () => {
    if (!user) return;
    setRunning(true);
    setResults([]);

    const tests: TestResult[] = [];
    const push = (r: TestResult) => {
      tests.push(r);
      setResults([...tests]);
    };

    // Detect admin status (used to interpret results correctly)
    const { data: adminCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const admin = !!adminCheck;
    setIsAdmin(admin);

    // Test 1: User can read their OWN roles
    {
      const { error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      push({
        name: "Read own roles",
        expectation: "Allowed for everyone",
        outcome: error ? "fail" : "pass",
        detail: error ? `Blocked unexpectedly: ${error.message}` : "Own roles readable",
      });
    }

    // Test 2: Reading OTHER users' roles
    {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .neq("user_id", user.id)
        .limit(1);
      const sawOthers = (data ?? []).length > 0;
      if (admin) {
        push({
          name: "Read other users' roles (as admin)",
          expectation: "Allowed for admins",
          outcome: error ? "fail" : "pass",
          detail: error ? error.message : `Visible rows: ${data?.length ?? 0}`,
        });
      } else {
        push({
          name: "Read other users' roles (as non-admin)",
          expectation: "Should return zero rows",
          outcome: sawOthers ? "fail" : "pass",
          detail: sawOthers
            ? `LEAK: saw ${data!.length} other-user role(s)`
            : "No other users' roles exposed",
        });
      }
    }

    // Test 3: Inserting a role for ANOTHER user
    {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: FAKE_UUID, role: "admin" as any });
      if (admin) {
        // Admin would succeed against a real user; fake UUID may still insert. Clean up.
        if (!error) {
          await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", FAKE_UUID)
            .eq("role", "admin");
        }
        push({
          name: "Grant role to arbitrary user (as admin)",
          expectation: "Allowed for admins",
          outcome: error ? "warn" : "pass",
          detail: error ? `Blocked: ${error.message}` : "Insert allowed (cleaned up)",
        });
      } else {
        push({
          name: "Grant role to arbitrary user (as non-admin)",
          expectation: "Must be blocked by RLS",
          outcome: error ? "pass" : "fail",
          detail: error
            ? "Insert correctly rejected"
            : "CRITICAL: privilege escalation possible",
        });
      }
    }

    // Test 4: Inserting a role for SELF (non-admin escalation)
    if (!admin) {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" as any });
      push({
        name: "Self-grant admin role",
        expectation: "Must be blocked by RLS",
        outcome: error ? "pass" : "fail",
        detail: error
          ? "Self-escalation correctly rejected"
          : "CRITICAL: user escalated themselves to admin",
      });
      // Cleanup if it somehow inserted
      if (!error) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", "admin");
      }
    }

    // Test 5: Deleting another user's role
    {
      const { error, count } = await supabase
        .from("user_roles")
        .delete({ count: "exact" })
        .eq("user_id", FAKE_UUID)
        .eq("role", "moderator");
      if (admin) {
        push({
          name: "Delete arbitrary role (as admin)",
          expectation: "Allowed for admins",
          outcome: error ? "fail" : "pass",
          detail: error ? error.message : `Delete query accepted (rows: ${count ?? 0})`,
        });
      } else {
        // Non-admins should either error or affect zero rows
        const safe = error || (count ?? 0) === 0;
        push({
          name: "Delete arbitrary role (as non-admin)",
          expectation: "Must affect zero rows",
          outcome: safe ? "pass" : "fail",
          detail: error
            ? "Delete correctly rejected"
            : (count ?? 0) === 0
            ? "No rows affected"
            : `LEAK: deleted ${count} row(s)`,
        });
      }
    }

    // Persist run history
    const passC = tests.filter((t) => t.outcome === "pass").length;
    const failC = tests.filter((t) => t.outcome === "fail").length;
    const warnC = tests.filter((t) => t.outcome === "warn").length;
    const overallRun: Outcome =
      failC > 0 ? "fail" : warnC > 0 ? "warn" : passC > 0 ? "pass" : "pending";

    const { error: insertError } = await supabase.from("rls_verification_runs").insert({
      user_id: user.id,
      ran_as_admin: admin,
      total_count: tests.length,
      pass_count: passC,
      fail_count: failC,
      warn_count: warnC,
      overall: overallRun,
      results: tests as any,
    });
    if (insertError) {
      console.warn("Failed to save RLS verification run:", insertError.message);
    } else {
      onRunSaved?.();
    }

    setRunning(false);
  };

  const passCount = results.filter((r) => r.outcome === "pass").length;
  const failCount = results.filter((r) => r.outcome === "fail").length;
  const overall: Outcome =
    running ? "running" :
    results.length === 0 ? "pending" :
    failCount > 0 ? "fail" :
    results.some((r) => r.outcome === "warn") ? "warn" : "pass";

  const OverallIcon = OUTCOME_META[overall].icon;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> RLS Verification — user_roles
            </CardTitle>
            <CardDescription>
              Probes the live database to confirm role management is properly protected
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {results.length > 0 && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${OUTCOME_META[overall].color}`}>
                <OverallIcon className={`w-3.5 h-3.5 ${overall === "running" ? "animate-spin" : ""}`} />
                {failCount > 0 ? `${failCount} failing` : `${passCount}/${results.length} passing`}
              </span>
            )}
            <Button size="sm" variant="outline" onClick={run} disabled={running || !user}>
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run tests
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isAdmin !== null && (
          <p className="text-xs text-muted-foreground mb-3">
            Tests executed as <span className="font-mono">{user?.email ?? user?.id}</span>{" "}
            <Badge variant="outline" className="ml-1">{isAdmin ? "admin" : "non-admin"}</Badge>
          </p>
        )}
        {results.length === 0 && !running ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Click "Run tests" to verify RLS policies on the user_roles table.
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((r, i) => {
              const meta = OUTCOME_META[r.outcome];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start justify-between gap-3 py-2 border-b border-border/30 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.expectation}</p>
                    <p className={`text-xs mt-1 ${meta.color}`}>{r.detail}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${meta.color}`}>
                    <Icon className={`w-3.5 h-3.5 ${r.outcome === "running" ? "animate-spin" : ""}`} />
                    {meta.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
        {failCount > 0 && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive">
              {failCount} RLS check{failCount > 1 ? "s" : ""} failed. Review user_roles policies immediately — privilege escalation may be possible.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
