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
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md sm:p-6",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold text-card-foreground sm:text-2xl">{value}</p>
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
    </div>
  );
}
