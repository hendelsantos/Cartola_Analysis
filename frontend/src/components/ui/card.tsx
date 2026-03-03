import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  glass?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
  glass,
  glow,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-300 sm:p-6",
        glass && "glass-card",
        glow && "glow-primary",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-card-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
