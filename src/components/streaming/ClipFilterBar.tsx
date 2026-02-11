import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, Clock, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Clip } from "@/hooks/useClipsGallery";
import type { CloudClip } from "@/hooks/useCloudClips";

export interface ClipFilters {
  search: string;
  durationRange: "all" | "short" | "medium" | "long";
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

const DURATION_RANGES = {
  all: { label: "Any duration", min: 0, max: Infinity },
  short: { label: "< 1 min", min: 0, max: 60 },
  medium: { label: "1–5 min", min: 60, max: 300 },
  long: { label: "> 5 min", min: 300, max: Infinity },
} as const;

const defaultFilters: ClipFilters = {
  search: "",
  durationRange: "all",
  dateFrom: undefined,
  dateTo: undefined,
};

export const useClipFilters = () => {
  const [filters, setFilters] = useState<ClipFilters>(defaultFilters);

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.durationRange !== "all") count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  const clearFilters = () => setFilters(defaultFilters);

  const filterLocalClips = (clips: Clip[]): Clip[] => {
    return clips.filter((clip) => {
      if (filters.search && !clip.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      const range = DURATION_RANGES[filters.durationRange];
      if (clip.duration < range.min || clip.duration >= range.max) return false;
      if (filters.dateFrom && clip.createdAt < filters.dateFrom) return false;
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (clip.createdAt > endOfDay) return false;
      }
      return true;
    });
  };

  const filterCloudClips = (clips: CloudClip[]): CloudClip[] => {
    return clips.filter((clip) => {
      if (filters.search && !clip.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      const dur = Number(clip.duration);
      const range = DURATION_RANGES[filters.durationRange];
      if (dur < range.min || dur >= range.max) return false;
      if (filters.dateFrom && new Date(clip.created_at) < filters.dateFrom) return false;
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(clip.created_at) > endOfDay) return false;
      }
      return true;
    });
  };

  return { filters, setFilters, activeCount, clearFilters, filterLocalClips, filterCloudClips };
};

interface ClipFilterBarProps {
  filters: ClipFilters;
  setFilters: (f: ClipFilters) => void;
  activeCount: number;
  clearFilters: () => void;
}

export const ClipFilterBar = ({ filters, setFilters, activeCount, clearFilters }: ClipFilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search clips..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="h-8 text-xs pl-8 pr-8"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="default" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-in">
          {/* Duration filter */}
          <Select
            value={filters.durationRange}
            onValueChange={(v) => setFilters({ ...filters, durationRange: v as ClipFilters["durationRange"] })}
          >
            <SelectTrigger className="h-7 w-auto min-w-[110px] text-xs gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DURATION_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", filters.dateFrom && "border-primary text-primary")}>
                <Calendar className="w-3 h-3" />
                {filters.dateFrom ? format(filters.dateFrom, "MMM d") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateFrom}
                onSelect={(d) => setFilters({ ...filters, dateFrom: d })}
                disabled={(d) => d > new Date() || (filters.dateTo ? d > filters.dateTo : false)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", filters.dateTo && "border-primary text-primary")}>
                <Calendar className="w-3 h-3" />
                {filters.dateTo ? format(filters.dateTo, "MMM d") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateTo}
                onSelect={(d) => setFilters({ ...filters, dateTo: d })}
                disabled={(d) => d > new Date() || (filters.dateFrom ? d < filters.dateFrom : false)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
