import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: string;
}

interface StatsTabProps {
  stats: StatCard[];
  loading: boolean;
}

export const StatsTab = ({ stats, loading }: StatsTabProps) => {
  return (
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
  );
};
