import { useState, useMemo } from "react";
import { Database, Search, ArrowUp, ArrowDown, Download, CheckSquare, Square, MinusSquare, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DatabaseTabProps {
  dbStats: { table: string; count: number }[];
  loading: boolean;
}

export const DatabaseTab = ({ dbStats, loading }: DatabaseTabProps) => {
  const [dbFilter, setDbFilter] = useState("");
  const [dbSort, setDbSort] = useState<{ key: "table" | "count"; dir: "asc" | "desc" }>({ key: "table", dir: "asc" });
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  const LARGE_EXPORT_THRESHOLD = 10;

  const filteredSorted = useMemo(() =>
    dbStats
      .filter((row) => row.table.toLowerCase().includes(dbFilter.toLowerCase()))
      .sort((a, b) => {
        const mul = dbSort.dir === "asc" ? 1 : -1;
        if (dbSort.key === "table") return mul * a.table.localeCompare(b.table);
        return mul * (a.count - b.count);
      }),
    [dbStats, dbFilter, dbSort]
  );

  const exportTargets = useMemo(() => {
    if (selectedTables.size === 0) return filteredSorted;
    return filteredSorted.filter((r) => selectedTables.has(r.table));
  }, [filteredSorted, selectedTables]);

  const toggleTable = (table: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(table)) next.delete(table);
      else next.add(table);
      return next;
    });
  };

  const toggleAll = () => {
    const allFilteredNames = filteredSorted.map((r) => r.table);
    const allSelected = allFilteredNames.every((t) => selectedTables.has(t));
    if (allSelected) {
      setSelectedTables((prev) => {
        const next = new Set(prev);
        allFilteredNames.forEach((t) => next.delete(t));
        return next;
      });
    } else {
      setSelectedTables((prev) => {
        const next = new Set(prev);
        allFilteredNames.forEach((t) => next.add(t));
        return next;
      });
    }
  };

  const selectionState = useMemo(() => {
    if (filteredSorted.length === 0) return "none" as const;
    const allSelected = filteredSorted.every((r) => selectedTables.has(r.table));
    const someSelected = filteredSorted.some((r) => selectedTables.has(r.table));
    if (allSelected) return "all" as const;
    if (someSelected) return "some" as const;
    return "none" as const;
  }, [filteredSorted, selectedTables]);

  const exportCsv = () => {
    try {
      if (exportTargets.length === 0) {
        toast.error("Nothing to export", { description: "No tables selected or matching the filter" });
        return;
      }
      const header = "Table,Row Count";
      const rows = exportTargets.map(r => `${r.table},${r.count}`);
      const total = `Total,${exportTargets.reduce((s, r) => s + r.count, 0)}`;
      const csv = [header, ...rows, "", total].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.download = `database-stats-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully", {
        description: `${exportTargets.length} tables exported`,
      });
    } catch (err) {
      console.error("CSV export failed:", err);
      toast.error("Export failed", { description: "An unexpected error occurred while generating the CSV" });
    }
  };

  const copyToClipboard = async () => {
    try {
      if (exportTargets.length === 0) {
        toast.error("Nothing to copy", { description: "No tables selected or matching the filter" });
        return;
      }
      const header = "Table\tRow Count";
      const rows = exportTargets.map(r => `${r.table}\t${r.count}`);
      const total = `Total\t${exportTargets.reduce((s, r) => s + r.count, 0)}`;
      const text = [header, ...rows, "", total].join("\n");
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard", {
        description: `${exportTargets.length} tables copied`,
      });
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Copy failed", { description: "Could not copy to clipboard" });
    }
  };

  const handleExportClick = () => {
    if (exportTargets.length >= LARGE_EXPORT_THRESHOLD) {
      setShowExportConfirm(true);
    } else {
      exportCsv();
    }
  };

  return (
    <div className="space-y-4">
      <AlertDialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export {exportTargets.length} tables?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to export data for {exportTargets.length} tables ({exportTargets.reduce((s, r) => s + r.count, 0).toLocaleString()} total rows) to a CSV file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={exportCsv}>Export</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bar Chart */}
      {!loading && dbStats.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Row Distribution</CardTitle>
            <div className="flex items-center gap-2">
              {selectedTables.size > 0 && (
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedTables.size} selected
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleExportClick}>
                <Download className="w-4 h-4 mr-2" />
                Export{selectedTables.size > 0 ? ` (${exportTargets.length})` : " All"}
              </Button>
            </div>
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
          <CardDescription>Select tables to export, or export all</CardDescription>
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
          {/* Select all / clear */}
          {!loading && filteredSorted.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {selectionState === "all" ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : selectionState === "some" ? (
                  <MinusSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {selectionState === "all" ? "Deselect all" : "Select all"}
              </button>
              {selectedTables.size > 0 && (
                <button
                  onClick={() => setSelectedTables(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 animate-pulse">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
              ))
            ) : (
              filteredSorted.map((row) => (
                <div
                  key={row.table}
                  onClick={() => toggleTable(row.table)}
                  className={`flex justify-between items-center py-2 px-2 rounded-md border border-transparent cursor-pointer transition-colors ${
                    selectedTables.has(row.table)
                      ? "bg-primary/10 border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTables.has(row.table)}
                      onCheckedChange={() => toggleTable(row.table)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4"
                    />
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
