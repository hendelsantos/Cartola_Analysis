import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null): string {
  if (value == null) return "C$ 0.00";
  return `C$ ${value.toFixed(2)}`;
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return "0.0%";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value == null) return "0";
  return value.toFixed(decimals);
}
