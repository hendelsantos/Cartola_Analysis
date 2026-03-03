"use client";

import { useEffect, useState } from "react";
import { getMercadoStatus, type MercadoStatus } from "@/lib/api";
import { RefreshCw, Wifi, WifiOff, Activity } from "lucide-react";

export function Header() {
  const [mercado, setMercado] = useState<MercadoStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMercadoStatus()
      .then(setMercado)
      .catch(() => setMercado(null))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      getMercadoStatus().then(setMercado).catch(() => {});
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const statusColor =
    mercado?.status_mercado === 1
      ? "text-success"
      : mercado?.status_mercado === 6
        ? "text-warning"
        : "text-danger";

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-secondary/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      {/* Spacer for mobile hamburger */}
      <div className="w-10 lg:hidden" />

      <div className="flex items-center gap-2">
        <Activity className="hidden h-4 w-4 text-primary sm:block" />
        <h2 className="text-sm font-semibold text-foreground sm:text-lg">
          Cartola Analytics
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <RefreshCw className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Carregando...</span>
          </div>
        ) : mercado ? (
          <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Wifi className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${statusColor}`} />
              <span className={`hidden sm:inline ${statusColor}`}>{mercado.status_label}</span>
            </div>
            <div className="rounded-md bg-muted/60 px-2 py-1 text-muted-foreground">
              R{mercado.rodada_atual}
            </div>
            {mercado.times_escalados > 0 && (
              <div className="hidden text-muted-foreground md:block">
                {mercado.times_escalados.toLocaleString("pt-BR")} times
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-danger sm:gap-2 sm:text-sm">
            <WifiOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">API offline</span>
          </div>
        )}
      </div>
    </header>
  );
}
