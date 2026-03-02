import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  className,
}: StatCardProps) {
  const trendPositive = trend && trend > 0;
  const trendNegative = trend && trend < 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        {trend !== undefined && (
          <div className="mt-1 flex items-center gap-1">
            {trendPositive ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : trendNegative ? (
              <TrendingDown className="h-3 w-3 text-danger" />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trendPositive
                  ? "text-success"
                  : trendNegative
                    ? "text-danger"
                    : "text-muted-foreground"
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend.toFixed(2)}
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
