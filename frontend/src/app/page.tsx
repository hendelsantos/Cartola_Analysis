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

  useEffect(() => {
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
      .catch(console.error)
      .finally(() => setLoading(false));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do Cartola FC · Temporada {mercado?.temporada || 2026}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Pontuadores */}
        <Card title="Top Pontuadores" subtitle="Por média de pontuação">
          <div className="space-y-3">
            {topPontuadores.map((atleta, i) => (
              <div
                key={atleta.atleta_id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
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
