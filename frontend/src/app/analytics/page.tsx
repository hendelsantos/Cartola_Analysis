"use client";

import { useState } from "react";
import { getAtletaAnalytics, type AtletaAnalytics } from "@/lib/api";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Search, BarChart3, Target, Activity, Zap } from "lucide-react";

export default function AnalyticsPage() {
  const [atletaId, setAtletaId] = useState("");
  const [analytics, setAnalytics] = useState<AtletaAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const id = Number(atletaId);
    if (!id || isNaN(id)) {
      setError("Digite um ID válido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getAtletaAnalytics(id);
      setAnalytics(data);
    } catch {
      setError("Atleta não encontrado ou sem dados");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const scoutLabels: Record<string, string> = {
    gols: "Gols",
    assistencias: "Assist.",
    finalizacoes_trave: "Fin. Trave",
    finalizacoes_defesa: "Fin. Defesa",
    desarmes: "Desarmes",
    defesas: "Defesas",
    faltas_sofridas: "Faltas Sof.",
    roubadas_bola: "Roubadas",
  };

  const scoutData = analytics
    ? Object.entries(analytics.scout_medio || {})
        .filter(([key]) => scoutLabels[key])
        .map(([key, value]) => ({
          subject: scoutLabels[key] || key,
          value: Number(value),
        }))
    : [];

  const pontosData = analytics
    ? analytics.ultimos_5_pontos.map((p, i) => ({
        rodada: `R${i + 1}`,
        pontos: p,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Análise avançada de atletas
        </p>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <input
            type="number"
            placeholder="ID do atleta (ex: 38099)"
            value={atletaId}
            onChange={(e) => setAtletaId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Analisando..." : "Analisar"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {analytics && (
        <>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h2 className="text-lg font-bold text-foreground">
              {analytics.apelido}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              title="Média"
              value={formatNumber(analytics.media)}
              icon={<Target className="h-5 w-5" />}
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Últimas Pontuações">
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

            {scoutData.length > 0 && (
              <Card title="Scout Médio (Radar)">
                <div className="h-64">
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
                        stroke="#e94560"
                        fill="#e94560"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
