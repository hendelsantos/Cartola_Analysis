"use client";

import { useEffect, useState } from "react";
import { getMercadoStatus, type MercadoStatus } from "@/lib/api";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

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
    <header className="flex h-16 items-center justify-between border-b border-border bg-secondary px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Cartola Analytics
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Status do Mercado */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : mercado ? (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${statusColor}`} />
              <span className={statusColor}>{mercado.status_label}</span>
            </div>
            <div className="text-muted-foreground">
              Rodada {mercado.rodada_atual}
            </div>
            {mercado.times_escalados > 0 && (
              <div className="text-muted-foreground">
                {mercado.times_escalados.toLocaleString("pt-BR")} times
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-danger">
            <WifiOff className="h-4 w-4" />
            API offline
          </div>
        )}
      </div>
    </header>
  );
}
