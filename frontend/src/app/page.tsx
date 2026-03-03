"use client";

import { useEffect, useState } from "react";
import {
  getMercadoStatus,
  getRankingPontuadores,
  getRankingValorizacoes,
  getRankingCustoBeneficio,
  type MercadoStatus,
  type RankingAtleta,
} from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Users,
  Trophy,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [mercado, setMercado] = useState<MercadoStatus | null>(null);
  const [topPontuadores, setTopPontuadores] = useState<RankingAtleta[]>([]);
  const [topValorizacoes, setTopValorizacoes] = useState<RankingAtleta[]>([]);
  const [topCustoBeneficio, setTopCustoBeneficio] = useState<RankingAtleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getMercadoStatus(),
      getRankingPontuadores(10),
      getRankingValorizacoes(10),
      getRankingCustoBeneficio(10),
    ])
      .then(([m, tp, tv, tcb]) => {
        setMercado(m);
        setTopPontuadores(tp);
        setTopValorizacoes(tv);
        setTopCustoBeneficio(tcb);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} title="Carregando...">
              <TableSkeleton rows={5} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="field-pattern relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-8">
        {/* Football field lines decoration */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-[0.04]">
          <svg viewBox="0 0 200 200" className="h-full w-full" fill="none" stroke="white" strokeWidth="1">
            <rect x="10" y="10" width="180" height="180" rx="4" />
            <line x1="100" y1="10" x2="100" y2="190" />
            <circle cx="100" cy="100" r="30" />
            <circle cx="100" cy="100" r="2" fill="white" />
            <rect x="10" y="60" width="40" height="80" />
            <rect x="150" y="60" width="40" height="80" />
            <rect x="10" y="80" width="20" height="40" />
            <rect x="170" y="80" width="20" height="40" />
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">
            Temporada {mercado?.temporada || 2026}
          </p>
          <h1 className="mt-1 text-xl font-extrabold text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-lg text-xs text-muted-foreground sm:text-sm">
            Análise completa de desempenho, valorizações e tendências do Cartola FC
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Rodada Atual"
          value={mercado?.rodada_atual || "-"}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Status"
          value={mercado?.status_label || "Desconhecido"}
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          title="Times Escalados"
          value={
            mercado?.times_escalados
              ? mercado.times_escalados.toLocaleString("pt-BR")
              : "-"
          }
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Maior Pontuador"
          value={
            topPontuadores[0]
              ? `${topPontuadores[0].apelido} (${formatNumber(topPontuadores[0].media)})`
              : "-"
          }
          icon={<Trophy className="h-5 w-5" />}
        />
      </div>

      {/* Rankings Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Top Pontuadores */}
        <Card title="Top Pontuadores" subtitle="Por média de pontuação">
          <div className="space-y-2 sm:space-y-3">
            {topPontuadores.map((atleta, i) => (
              <div
                key={atleta.atleta_id}
                className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {atleta.apelido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {atleta.clube_nome} · {atleta.posicao}
                    </p>
                  </div>
                </div>
                <Badge variant="success">
                  {formatNumber(atleta.media)} pts
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Valorizações */}
        <Card title="Maiores Valorizações" subtitle="Variação de preço">
          <div className="space-y-3">
            {topValorizacoes.map((atleta, i) => (
              <div
                key={atleta.atleta_id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {atleta.apelido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(atleta.preco)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={(atleta.variacao ?? 0) >= 0 ? "success" : "danger"}
                >
                  {(atleta.variacao ?? 0) > 0 ? "+" : ""}
                  {formatCurrency(atleta.variacao)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Custo-Benefício */}
        <Card title="Melhor Custo-Benefício" subtitle="Pontos por C$">
          <div className="space-y-3">
            {topCustoBeneficio.map((atleta, i) => (
              <div
                key={atleta.atleta_id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {atleta.apelido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(atleta.preco)}
                    </p>
                  </div>
                </div>
                <Badge>{formatNumber(atleta.media)} pts/C$</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
