"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAtleta, getAtletaAnalytics, type Atleta, type AtletaAnalytics } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Target,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function AtletaDetailPage() {
  const params = useParams();
  const atletaId = Number(params.id);
  const [atleta, setAtleta] = useState<Atleta | null>(null);
  const [analytics, setAnalytics] = useState<AtletaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!atletaId) return;
    Promise.all([getAtleta(atletaId), getAtletaAnalytics(atletaId)])
      .then(([a, an]) => {
        setAtleta(a);
        setAnalytics(an);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [atletaId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!atleta || !analytics) {
    return (
      <div className="text-center text-muted-foreground">
        Atleta não encontrado.
      </div>
    );
  }

  // Chart data
  const pontosData = analytics.ultimos_5_pontos.map((p, i) => ({
    rodada: `R${i + 1}`,
    pontos: p,
  }));

  const scoutLabels: Record<string, string> = {
    gols: "Gols",
    assistencias: "Assist.",
    finalizacoes_trave: "Fin. Trave",
    finalizacoes_defesa: "Fin. Defesa",
    finalizacoes_fora: "Fin. Fora",
    faltas_sofridas: "Faltas Sof.",
    desarmes: "Desarmes",
    defesas: "Defesas",
    impedimentos: "Impedimentos",
  };

  const scoutData = Object.entries(analytics.scout_medio || {})
    .filter(([key]) => scoutLabels[key])
    .map(([key, value]) => ({
      subject: scoutLabels[key] || key,
      value: Number(value),
    }));

  const precoData = analytics.tendencia_preco.map((p, i) => ({
    rodada: `R${i + 1}`,
    preco: p,
  }));

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/atletas"
          className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {atleta.apelido}
          </h1>
          <p className="text-sm text-muted-foreground">
            {atleta.clube_nome} · {atleta.posicao_nome} · {atleta.nome}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Média"
          value={formatNumber(analytics.media)}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Preço"
          value={formatCurrency(atleta.preco_num)}
          trend={atleta.variacao_num}
          trendLabel="variação"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Regularidade"
          value={`${formatNumber(analytics.regularidade * 100, 0)}%`}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Pts/Cartoleta"
          value={formatNumber(analytics.pontos_por_cartoleta)}
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          title="Projeção"
          value={formatNumber(analytics.projecao)}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Últimos pontos */}
        <Card title="Últimas Pontuações" subtitle="Por rodada">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pontosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="rodada" stroke="#a0a0b8" fontSize={12} />
                <YAxis stroke="#a0a0b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #2a2a4a",
                    borderRadius: "8px",
                    color: "#f0f0f0",
                  }}
                />
                <Bar dataKey="pontos" fill="#00875a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tendência de preço */}
        <Card title="Tendência de Preço" subtitle="Evolução em cartoletas">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={precoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="rodada" stroke="#a0a0b8" fontSize={12} />
                <YAxis stroke="#a0a0b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #2a2a4a",
                    borderRadius: "8px",
                    color: "#f0f0f0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="preco"
                  stroke="#e94560"
                  strokeWidth={2}
                  dot={{ fill: "#e94560" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Scout Radar */}
        {scoutData.length > 0 && (
          <Card
            title="Scout Médio"
            subtitle="Radar de estatísticas por rodada"
            className="lg:col-span-2"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={scoutData}>
                  <PolarGrid stroke="#2a2a4a" />
                  <PolarAngleAxis
                    dataKey="subject"
                    stroke="#a0a0b8"
                    fontSize={11}
                  />
                  <PolarRadiusAxis stroke="#2a2a4a" fontSize={10} />
                  <Radar
                    name="Scout"
                    dataKey="value"
                    stroke="#00875a"
                    fill="#00875a"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
