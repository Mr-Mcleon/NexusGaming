import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const requirements = [
  { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const getStrength = (passed: number): { label: string; color: string; percent: number } => {
  if (passed <= 1) return { label: "Weak", color: "bg-destructive", percent: 20 };
  if (passed <= 2) return { label: "Fair", color: "bg-orange-500", percent: 40 };
  if (passed <= 3) return { label: "Good", color: "bg-yellow-500", percent: 60 };
  if (passed <= 4) return { label: "Strong", color: "bg-emerald-500", percent: 80 };
  return { label: "Very Strong", color: "bg-primary", percent: 100 };
};

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const results = useMemo(
    () => requirements.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );

  const passed = results.filter((r) => r.passed).length;
  const strength = getStrength(passed);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground w-20 text-right">
          {strength.label}
        </span>
      </div>

      {/* Requirements */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {results.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5 text-xs">
            {r.passed ? (
              <Check className="w-3 h-3 text-primary shrink-0" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            )}
            <span className={r.passed ? "text-foreground" : "text-muted-foreground/60"}>
              {r.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
