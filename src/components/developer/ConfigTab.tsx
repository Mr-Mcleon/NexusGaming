import { ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ConfigOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface ConfigTabProps {
  config: ConfigOption[];
  onToggle: (id: string) => void;
}

export const ConfigTab = ({ config, onToggle }: ConfigTabProps) => {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">App Configuration</CardTitle>
        <CardDescription>Toggle features and system settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {config.map((option) => (
            <div key={option.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                {option.enabled ? (
                  <ToggleRight className="w-5 h-5 text-primary" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor={option.id} className="cursor-pointer font-medium">{option.label}</Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <Switch
                id={option.id}
                checked={option.enabled}
                onCheckedChange={() => onToggle(option.id)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
