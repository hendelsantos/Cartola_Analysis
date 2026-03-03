"use client";

import { useState } from "react";
import { buildLineup, type LineupResponse, type LineupPlayer } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Users,
  Trophy,
  DollarSign,
  Target,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const formations = [
  "3-4-3",
  "3-5-2",
  "4-3-3",
  "4-4-2",
  "4-5-1",
  "5-3-2",
  "5-4-1",
];

const strategies = [
  { key: "balanced", label: "Equilibrado", icon: Target, desc: "Maximiza pontuação prevista" },
  { key: "aggressive", label: "Agressivo", icon: Zap, desc: "Jogadores explosivos" },
  { key: "conservative", label: "Conservador", icon: Shield, desc: "Jogadores consistentes" },
  { key: "value", label: "Custo-Benefício", icon: DollarSign, desc: "Melhor preço por ponto" },
];

const positionColors: Record<string, string> = {
  GOL: "bg-yellow-500/20 text-yellow-400",
  ZAG: "bg-blue-500/20 text-blue-400",
  LAT: "bg-cyan-500/20 text-cyan-400",
  MEI: "bg-green-500/20 text-green-400",
  ATA: "bg-red-500/20 text-red-400",
};

const riskColors: Record<string, string> = {
  baixo: "success",
  moderado: "warning",
  alto: "danger",
  muito_alto: "danger",
  desconhecido: "muted",
};

export default function EscalacaoPage() {
  const [formation, setFormation] = useState("4-4-2");
  const [strategy, setStrategy] = useState("balanced");
  const [budget, setBudget] = useState(140);
  const [lineup, setLineup] = useState<LineupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuild() {
    setLoading(true);
    setError(null);
    try {
      const result = await buildLineup({ budget, formation, strategy });
      setLineup(result);
      if (!result.success) {
        setError(result.message || "Não foi possível montar o time");
      }
    } catch (e) {
      setError("Erro ao montar escalação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Escalação Inteligente
        </h1>
        <p className="text-sm text-muted-foreground">
          Monte o melhor time com base em previsões e análises estatísticas
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Formation */}
        <Card title="Formação">
          <div className="flex flex-wrap gap-2">
            {formations.map((f) => (
              <button
                key={f}
                onClick={() => setFormation(f)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  formation === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Card>

        {/* Strategy */}
        <Card title="Estratégia">
          <div className="space-y-2">
            {strategies.map((s) => (
              <button
                key={s.key}
                onClick={() => setStrategy(s.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  strategy === s.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <s.icon className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs opacity-70">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Budget + Action */}
        <Card title="Orçamento">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Cartoletas disponíveis
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={50}
                max={300}
                step={5}
                className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-foreground"
              />
              <input
                type="range"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={50}
                max={300}
                step={5}
                className="mt-2 w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>C$ 50</span>
                <span className="font-bold text-primary">
                  {formatCurrency(budget)}
                </span>
                <span>C$ 300</span>
              </div>
            </div>
            <button
              onClick={handleBuild}
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      className="opacity-75"
                    />
                  </svg>
                  Calculando...
                </span>
              ) : (
                "Montar Escalação"
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Results */}
      {lineup?.success && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Projeção Total</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {formatNumber(lineup.total_prediction)} pts
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Preço Total</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatCurrency(lineup.total_price)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Sobra</p>
              <p className="mt-1 text-2xl font-bold text-success">
                {formatCurrency(lineup.remaining_budget)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Média Histórica</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatNumber(lineup.total_media)} pts
              </p>
            </div>
          </div>

          {/* Lineup Table */}
          <Card
            title={`Escalação ${lineup.formation}`}
            subtitle={`${lineup.players_count} jogadores · Estratégia: ${
              strategies.find((s) => s.key === lineup.strategy)?.label
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Pos</th>
                    <th className="pb-3 font-medium">Jogador</th>
                    <th className="pb-3 font-medium">Clube</th>
                    <th className="pb-3 font-medium text-right">Preço</th>
                    <th className="pb-3 font-medium text-right">Média</th>
                    <th className="pb-3 font-medium text-right">Projeção</th>
                    <th className="pb-3 font-medium text-right">Intervalo</th>
                    <th className="pb-3 font-medium text-right">Confiança</th>
                    <th className="pb-3 font-medium text-center">Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {lineup.players.map((player) => (
                    <tr
                      key={player.atleta_id}
                      className="border-b border-border/50 hover:bg-muted/50"
                    >
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                            positionColors[player.posicao.toUpperCase()] ||
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {player.posicao.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-foreground">
                        {player.apelido}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {player.clube_nome}
                      </td>
                      <td className="py-3 text-right text-foreground">
                        {formatCurrency(player.preco)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatNumber(player.media)}
                      </td>
                      <td className="py-3 text-right font-semibold text-primary">
                        {formatNumber(player.projecao)}
                      </td>
                      <td className="py-3 text-right text-xs text-muted-foreground">
                        {formatNumber(player.min_score)} ~ {formatNumber(player.max_score)}
                      </td>
                      <td className="py-3 text-right text-foreground">
                        {formatNumber(player.confidence)}%
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={
                            (riskColors[player.risk_label] as
                              | "success"
                              | "warning"
                              | "danger"
                              | "muted") || "muted"
                          }
                        >
                          {player.risk_label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-semibold">
                    <td colSpan={3} className="pt-3">
                      TOTAL
                    </td>
                    <td className="pt-3 text-right">
                      {formatCurrency(lineup.total_price)}
                    </td>
                    <td className="pt-3 text-right">
                      {formatNumber(lineup.total_media)}
                    </td>
                    <td className="pt-3 text-right text-primary">
                      {formatNumber(lineup.total_prediction)}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Empty state */}
      {!lineup && !loading && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">
              Monte sua escalação
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Escolha a formação, estratégia e orçamento, depois clique em
              &quot;Montar Escalação&quot; para ver a melhor seleção possível.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
