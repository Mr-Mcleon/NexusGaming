import { useState } from "react";
import { Database, Search, ArrowUp, ArrowDown, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DatabaseTabProps {
  dbStats: { table: string; count: number }[];
  loading: boolean;
}

export const DatabaseTab = ({ dbStats, loading }: DatabaseTabProps) => {
  const [dbFilter, setDbFilter] = useState("");
  const [dbSort, setDbSort] = useState<{ key: "table" | "count"; dir: "asc" | "desc" }>({ key: "table", dir: "asc" });

  const filteredSorted = dbStats
    .filter((row) => row.table.toLowerCase().includes(dbFilter.toLowerCase()))
    .sort((a, b) => {
      const mul = dbSort.dir === "asc" ? 1 : -1;
      if (dbSort.key === "table") return mul * a.table.localeCompare(b.table);
      return mul * (a.count - b.count);
    });

  const exportCsv = () => {
    const header = "Table,Row Count";
    const rows = filteredSorted.map(r => `${r.table},${r.count}`);
    const total = `Total,${filteredSorted.reduce((s, r) => s + r.count, 0)}`;
    const csv = [header, ...rows, "", total].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "database-stats.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
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
              filteredSorted.map((row) => (
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
            {!loading && filteredSorted.length === 0 && (
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
    </div>
  );
};
