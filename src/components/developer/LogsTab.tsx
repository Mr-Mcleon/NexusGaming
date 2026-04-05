import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
}

interface LogsTabProps {
  logs: LogEntry[];
  loading: boolean;
}

const getLogIcon = (type: LogEntry["type"]) => {
  switch (type) {
    case "error": return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />;
    case "success": return <CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />;
    default: return <Info className="w-4 h-4 text-primary" />;
  }
};

export const LogsTab = ({ logs, loading }: LogsTabProps) => {
  return (
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
  );
};
