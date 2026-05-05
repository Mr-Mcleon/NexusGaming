import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, ShieldCheck, User as UserIcon, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppRole = "admin" | "moderator" | "user";
const ROLES: AppRole[] = ["admin", "moderator", "user"];

interface ProfileRow {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

interface UserWithRoles extends ProfileRow {
  roles: AppRole[];
}

const ROLE_META: Record<AppRole, { label: string; icon: typeof Shield; className: string }> = {
  admin:     { label: "Admin",     icon: ShieldCheck, className: "text-[hsl(var(--success))] border-[hsl(var(--success))]/40" },
  moderator: { label: "Moderator", icon: Shield,      className: "text-primary border-primary/40" },
  user:      { label: "User",      icon: UserIcon,    className: "text-muted-foreground border-border" },
};

export function UserRolesManager() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingRemoveAdmin, setPendingRemoveAdmin] = useState<{ userId: string; username: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("user_id, username, avatar_url").order("username"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr || rErr) {
      toast.error("Failed to load users", { description: pErr?.message || rErr?.message });
      setLoading(false);
      return;
    }
    const map = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    setUsers(
      (profiles ?? []).map((p: any) => ({
        user_id: p.user_id,
        username: p.username,
        avatar_url: p.avatar_url,
        roles: map.get(p.user_id) ?? [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: AppRole, hasRole: boolean) => {
    setBusy(`${userId}:${role}`);
    try {
      if (hasRole) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
        toast.success(`Removed ${role} role`);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
        toast.success(`Granted ${role} role`);
      }
      await load();
    } catch (e: any) {
      toast.error("Action failed", { description: e.message });
    } finally {
      setBusy(null);
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.includes(search)
  );

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> User Roles
            </CardTitle>
            <CardDescription>Grant or revoke admin and moderator access</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No users found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((u, i) => (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center justify-between gap-3 py-3 border-b border-border/30 last:border-0 flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback>{(u.username ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.username ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{u.user_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {u.roles.length > 0 && (
                    <div className="flex gap-1 mr-2">
                      {u.roles.map((r) => {
                        const Icon = ROLE_META[r].icon;
                        return (
                          <Badge key={r} variant="outline" className={`gap-1 ${ROLE_META[r].className}`}>
                            <Icon className="w-3 h-3" /> {ROLE_META[r].label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  {ROLES.filter((r) => r !== "user").map((r) => {
                    const has = u.roles.includes(r);
                    const isBusy = busy === `${u.user_id}:${r}`;
                    return (
                      <Button
                        key={r}
                        size="sm"
                        variant={has ? "destructive" : "outline"}
                        disabled={isBusy}
                        onClick={() => {
                          if (has && r === "admin") {
                            setPendingRemoveAdmin({ userId: u.user_id, username: u.username ?? "this user" });
                          } else {
                            toggleRole(u.user_id, r, has);
                          }
                        }}
                      >
                        {isBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : has ? `Revoke ${ROLE_META[r].label}` : `Make ${ROLE_META[r].label}`}
                      </Button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!pendingRemoveAdmin} onOpenChange={(o) => !o && setPendingRemoveAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke admin role?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoveAdmin?.username} will lose access to the admin dashboard and role management. This cannot be undone without another admin re-granting it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRemoveAdmin) {
                  toggleRole(pendingRemoveAdmin.userId, "admin", true);
                  setPendingRemoveAdmin(null);
                }
              }}
            >
              Revoke admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
