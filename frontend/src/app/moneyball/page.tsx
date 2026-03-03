"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CircleDollarSign,
  Sparkles,
  ArrowUpDown,
  Flame,
  Shield,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Search,
  Target,
  Zap,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import {
  getMoneyballAnalysis,
  getMoneyballCorrelations,
  MoneyballPlayer,
  MoneyballAnalysis,
  MoneyballCorrelations,
  PositionCorrelation,
} from "@/lib/api";
import { PosBadge, MiniSparkline, MoneyballStatCard, POS_COLORS } from "@/components/ui/cartola";

// ── Constants ─────────────────────────────────────────────────

const TABS = [
  { id: "alpha", label: "Ineficiências", icon: CircleDollarSign, desc: "Jogadores subvalorizados pelo mercado" },
  { id: "gems", label: "Gems", icon: Sparkles, desc: "Baratos com alto potencial oculto" },
  { id: "regression", label: "Regressão", icon: ArrowUpDown, desc: "Quem vai subir e quem vai cair" },
  { id: "momentum", label: "Momentum", icon: Flame, desc: "Forma recente vs histórica" },
  { id: "consistency", label: "Consistência", icon: Shield, desc: "Produção confiável e previsível" },
  { id: "correlations", label: "DNA Scout", icon: BarChart3, desc: "Quais scouts realmente importam" },
];

// ── Helpers ──────────────────────────────────────────────────

function alphaColor(alpha: number, avg: number) {
  const ratio = avg > 0 ? alpha / avg : 1;
  if (ratio > 1.5) return "text-emerald-400";
  if (ratio > 1.2) return "text-green-400";
  if (ratio > 0.8) return "text-gray-300";
  if (ratio > 0.5) return "text-orange-400";
  return "text-red-400";
}

function momentumColor(m: number) {
  if (m > 30) return "text-emerald-400";
  if (m > 10) return "text-green-400";
  if (m > -10) return "text-gray-400";
  if (m > -30) return "text-orange-400";
  return "text-red-400";
}

function regressionBadge(r: number) {
  if (r > 1) return { text: "COMPRA FORTE", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  if (r > 0.5) return { text: "COMPRA", cls: "bg-green-500/20 text-green-400 border-green-500/30" };
  if (r > -0.5) return { text: "NEUTRO", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  if (r > -1) return { text: "EVITAR", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
  return { text: "VENDER", cls: "bg-red-500/20 text-red-400 border-red-500/30" };
}

function consistencyColor(c: number) {
  if (c >= 70) return "text-emerald-400";
  if (c >= 50) return "text-green-400";
  if (c >= 30) return "text-yellow-400";
  return "text-red-400";
}

// ── Tab Contents ────────────────────────────────────────────

function AlphaTable({ players, avgAlpha }: { players: MoneyballPlayer[]; avgAlpha: Record<string, number> }) {
  const [filter, setFilter] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const sorted = useMemo(() => {
    let list = [...players].sort((a, b) => b.alpha - a.alpha);
    if (posFilter !== "ALL") list = list.filter(p => p.posicao === posFilter);
    if (filter) list = list.filter(p => p.apelido.toLowerCase().includes(filter.toLowerCase()));
    return list.slice(0, 60);
  }, [players, filter, posFilter]);
  const globalAvg = Object.values(avgAlpha).reduce((s, v) => s + v, 0) / (Object.keys(avgAlpha).length || 1);
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Buscar jogador..." className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "GOL", "LAT", "ZAG", "MEI", "ATA", "TEC"].map(p => (
            <button key={p} onClick={() => setPosFilter(p)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${posFilter === p ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:text-gray-200"}`}>
              {p === "ALL" ? "Todos" : p}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-800">
              <th className="text-left py-3 px-2">#</th>
              <th className="text-left py-3 px-2">Jogador</th>
              <th className="text-center py-3 px-2 hidden sm:table-cell">Pos</th>
              <th className="text-right py-3 px-2">C$</th>
              <th className="text-right py-3 px-2">Média</th>
              <th className="text-right py-3 px-2">xPts</th>
              <th className="text-right py-3 px-2 font-bold text-emerald-500">α Alpha</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Floor</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Ceil</th>
              <th className="text-center py-3 px-2 hidden lg:table-cell">Últimos</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.atleta_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 px-2 text-gray-600 text-xs">{i + 1}</td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <span className="sm:hidden"><PosBadge pos={p.posicao} /></span>
                    <div>
                      <div className="font-medium text-gray-200">{p.apelido}</div>
                      <div className="text-[11px] text-gray-500">{p.clube_abreviacao} · {p.jogos}j</div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-center hidden sm:table-cell"><PosBadge pos={p.posicao} /></td>
                <td className="py-2.5 px-2 text-right text-gray-300">C$ {p.preco.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-gray-300">{p.media.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right font-medium text-blue-400">{p.xpts.toFixed(1)}</td>
                <td className={`py-2.5 px-2 text-right font-bold ${alphaColor(p.alpha, globalAvg)}`}>
                  {p.alpha.toFixed(2)}
                  {p.is_undervalued && <span className="ml-1 text-emerald-500">★</span>}
                </td>
                <td className="py-2.5 px-2 text-right text-gray-500 hidden md:table-cell">{p.floor.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-gray-500 hidden md:table-cell">{p.ceiling.toFixed(1)}</td>
                <td className="py-2.5 px-2 hidden lg:table-cell"><MiniSparkline data={p.points_history} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GemsTable({ players }: { players: MoneyballPlayer[] }) {
  const gems = useMemo(() =>
    [...players].filter(p => p.preco <= 12 && p.xpts > 0).sort((a, b) => b.xpts - a.xpts).slice(0, 40),
    [players]
  );
  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        💎 Jogadores baratos (C$ ≤ 12) com alta produção de scouts. O &quot;Billy Beane special&quot; — valor máximo por cartoleta.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-800">
              <th className="text-left py-3 px-2">#</th>
              <th className="text-left py-3 px-2">Jogador</th>
              <th className="text-center py-3 px-2 hidden sm:table-cell">Pos</th>
              <th className="text-right py-3 px-2 text-amber-400">C$</th>
              <th className="text-right py-3 px-2">Média</th>
              <th className="text-right py-3 px-2 text-blue-400">xPts</th>
              <th className="text-right py-3 px-2 text-emerald-400">α Alpha</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Consist.</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Pts+ %</th>
              <th className="text-center py-3 px-2 hidden lg:table-cell">Sparkline</th>
            </tr>
          </thead>
          <tbody>
            {gems.map((p, i) => (
              <tr key={p.atleta_id} className="border-b border-gray-800/50 hover:bg-amber-500/5 transition-colors">
                <td className="py-2.5 px-2 text-gray-600 text-xs">{i + 1}</td>
                <td className="py-2.5 px-2">
                  <div><span className="font-medium text-gray-200">{p.apelido}</span></div>
                  <div className="text-[11px] text-gray-500">{p.clube_abreviacao} · {p.jogos}j</div>
                </td>
                <td className="py-2.5 px-2 text-center hidden sm:table-cell"><PosBadge pos={p.posicao} /></td>
                <td className="py-2.5 px-2 text-right text-amber-400 font-medium">C$ {p.preco.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-gray-300">{p.media.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-blue-400 font-medium">{p.xpts.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">{p.alpha.toFixed(2)}</td>
                <td className={`py-2.5 px-2 text-right hidden md:table-cell ${consistencyColor(p.consistency)}`}>{p.consistency}%</td>
                <td className="py-2.5 px-2 text-right text-gray-400 hidden md:table-cell">{p.pos_pct}%</td>
                <td className="py-2.5 px-2 hidden lg:table-cell"><MiniSparkline data={p.points_history} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {gems.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum gem encontrado com os filtros atuais.</p>}
    </div>
  );
}

function RegressionTable({ players }: { players: MoneyballPlayer[] }) {
  const buy = useMemo(() => [...players].filter(p => p.regression > 0.5).sort((a, b) => b.regression - a.regression).slice(0, 25), [players]);
  const sell = useMemo(() => [...players].filter(p => p.regression < -0.5).sort((a, b) => a.regression - b.regression).slice(0, 25), [players]);
  const RegrRow = ({ p, i }: { p: MoneyballPlayer; i: number }) => {
    const badge = regressionBadge(p.regression);
    return (
      <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
        <td className="py-2.5 px-2 text-gray-600 text-xs">{i + 1}</td>
        <td className="py-2.5 px-2">
          <div className="font-medium text-gray-200">{p.apelido}</div>
          <div className="text-[11px] text-gray-500">{p.clube_abreviacao} · {p.posicao}</div>
        </td>
        <td className="py-2.5 px-2 text-right text-gray-300">C$ {p.preco.toFixed(1)}</td>
        <td className="py-2.5 px-2 text-right text-gray-300">{p.media.toFixed(1)}</td>
        <td className="py-2.5 px-2 text-right text-blue-400">{p.xpts.toFixed(1)}</td>
        <td className="py-2.5 px-2 text-right">
          <span className={`font-bold ${p.regression > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {p.regression > 0 ? "+" : ""}{p.regression.toFixed(2)}σ
          </span>
        </td>
        <td className="py-2.5 px-2 text-center">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.text}</span>
        </td>
      </tr>
    );
  };
  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        📊 Regressão à média: jogadores cuja performance real se desvia do esperado pelos scouts.
        Positivo = underperforming (oportunidade de compra). Negativo = overperforming (risco de queda).
      </p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h3 className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
            <TrendingUp className="w-4 h-4" /> Sinal de Compra — Vão Subir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Jogador</th>
                  <th className="text-right py-2 px-2">C$</th><th className="text-right py-2 px-2">Média</th>
                  <th className="text-right py-2 px-2">xPts</th><th className="text-right py-2 px-2">Regressão</th>
                  <th className="text-center py-2 px-2">Sinal</th>
                </tr>
              </thead>
              <tbody>{buy.map((p, i) => <RegrRow key={p.atleta_id} p={p} i={i} />)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-red-400 font-semibold mb-3">
            <TrendingDown className="w-4 h-4" /> Sinal de Venda — Vão Cair
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Jogador</th>
                  <th className="text-right py-2 px-2">C$</th><th className="text-right py-2 px-2">Média</th>
                  <th className="text-right py-2 px-2">xPts</th><th className="text-right py-2 px-2">Regressão</th>
                  <th className="text-center py-2 px-2">Sinal</th>
                </tr>
              </thead>
              <tbody>{sell.map((p, i) => <RegrRow key={p.atleta_id} p={p} i={i} />)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MomentumTable({ players }: { players: MoneyballPlayer[] }) {
  const hot = useMemo(() => [...players].filter(p => p.momentum > 5).sort((a, b) => b.momentum - a.momentum).slice(0, 25), [players]);
  const cold = useMemo(() => [...players].filter(p => p.momentum < -5).sort((a, b) => a.momentum - b.momentum).slice(0, 25), [players]);
  const Row = ({ p, i }: { p: MoneyballPlayer; i: number }) => (
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
      <td className="py-2.5 px-2 text-gray-600 text-xs">{i + 1}</td>
      <td className="py-2.5 px-2">
        <div className="font-medium text-gray-200">{p.apelido}</div>
        <div className="text-[11px] text-gray-500">{p.clube_abreviacao} · {p.posicao}</div>
      </td>
      <td className="py-2.5 px-2 text-right text-gray-300">C$ {p.preco.toFixed(1)}</td>
      <td className="py-2.5 px-2 text-right text-gray-300">{p.media.toFixed(1)}</td>
      <td className="py-2.5 px-2 text-right text-amber-400">{p.avg_last_3.toFixed(1)}</td>
      <td className={`py-2.5 px-2 text-right font-bold ${momentumColor(p.momentum)}`}>
        {p.momentum > 0 ? "+" : ""}{p.momentum.toFixed(0)}%
      </td>
      <td className="py-2.5 px-2"><MiniSparkline data={p.points_history} /></td>
    </tr>
  );
  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">🔥 Momentum: comparação da média das últimas 3 rodadas vs média geral. Identifica tendências de alta e queda.</p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h3 className="flex items-center gap-2 text-emerald-400 font-semibold mb-3"><Flame className="w-4 h-4" /> Em Alta — Hot Streak</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-800">
                <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Jogador</th>
                <th className="text-right py-2 px-2">C$</th><th className="text-right py-2 px-2">Média</th>
                <th className="text-right py-2 px-2">Últ. 3</th><th className="text-right py-2 px-2">Momentum</th>
                <th className="py-2 px-2">Trend</th>
              </tr></thead>
              <tbody>{hot.map((p, i) => <Row key={p.atleta_id} p={p} i={i} />)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-blue-400 font-semibold mb-3"><TrendingDown className="w-4 h-4" /> Em Baixa — Cold Streak</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-800">
                <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Jogador</th>
                <th className="text-right py-2 px-2">C$</th><th className="text-right py-2 px-2">Média</th>
                <th className="text-right py-2 px-2">Últ. 3</th><th className="text-right py-2 px-2">Momentum</th>
                <th className="py-2 px-2">Trend</th>
              </tr></thead>
              <tbody>{cold.map((p, i) => <Row key={p.atleta_id} p={p} i={i} />)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsistencyTable({ players }: { players: MoneyballPlayer[] }) {
  const sorted = useMemo(() =>
    [...players].filter(p => p.media > 0).sort((a, b) => b.consistency - a.consistency).slice(0, 50),
    [players]
  );
  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        🛡️ Os mais confiáveis: jogadores com baixa variância e alta taxa de pontuação positiva. Produção previsível.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-800">
            <th className="text-left py-3 px-2">#</th>
            <th className="text-left py-3 px-2">Jogador</th>
            <th className="text-center py-3 px-2 hidden sm:table-cell">Pos</th>
            <th className="text-right py-3 px-2">C$</th>
            <th className="text-right py-3 px-2">Média</th>
            <th className="text-right py-3 px-2 text-purple-400">Consist.</th>
            <th className="text-right py-3 px-2">Sharpe</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">σ Desvio</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">Pts+ %</th>
            <th className="text-right py-3 px-2 hidden lg:table-cell">Floor</th>
            <th className="text-right py-3 px-2 hidden lg:table-cell">Ceiling</th>
          </tr></thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.atleta_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 px-2 text-gray-600 text-xs">{i + 1}</td>
                <td className="py-2.5 px-2">
                  <div className="font-medium text-gray-200">{p.apelido}</div>
                  <div className="text-[11px] text-gray-500">{p.clube_abreviacao} · {p.jogos}j</div>
                </td>
                <td className="py-2.5 px-2 text-center hidden sm:table-cell"><PosBadge pos={p.posicao} /></td>
                <td className="py-2.5 px-2 text-right text-gray-300">C$ {p.preco.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-gray-300">{p.media.toFixed(1)}</td>
                <td className={`py-2.5 px-2 text-right font-bold ${consistencyColor(p.consistency)}`}>{p.consistency}%</td>
                <td className="py-2.5 px-2 text-right text-amber-400">{p.sharpe.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right text-gray-500 hidden md:table-cell">{p.std_dev.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-gray-400 hidden md:table-cell">{p.pos_pct}%</td>
                <td className="py-2.5 px-2 text-right text-red-400/70 hidden lg:table-cell">{p.floor.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-right text-emerald-400/70 hidden lg:table-cell">{p.ceiling.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CorrelationsView({ correlations }: { correlations: MoneyballCorrelations | null }) {
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const positions = correlations ? Object.keys(correlations) : [];
  const pos = selectedPos || positions[0] || null;
  const data = pos && correlations ? correlations[pos] : null;

  useEffect(() => {
    if (positions.length > 0 && !selectedPos) setSelectedPos(positions[0]);
  }, [positions, selectedPos]);

  if (!correlations || positions.length === 0) {
    return <p className="text-center text-gray-500 py-8">Carregando correlações...</p>;
  }

  const scouts = data ? Object.entries(data.scouts) : [];

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        🧬 DNA Scout: correlação de Pearson entre cada scout e a pontuação final. Revela quais ações realmente importam para cada posição — e onde o mercado erra em valorizar.
      </p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {positions.map(p => (
          <button key={p} onClick={() => setSelectedPos(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${pos === p ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:text-gray-200"}`}>
            {data && pos === p ? data.posicao_nome : correlations[p]?.posicao_nome || p}
          </button>
        ))}
      </div>
      {data && (
        <div>
          <p className="text-xs text-gray-500 mb-3">Amostra: {data.sample_size} observações</p>
          <div className="space-y-2">
            {scouts.map(([key, s]) => {
              const absCorr = Math.abs(s.correlation);
              const barWidth = absCorr * 100;
              const isStrong = absCorr > 0.3;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-32 sm:w-40 text-sm text-gray-300 truncate">{s.label}</div>
                  <div className="flex-1 h-6 bg-gray-800/50 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${s.correlation > 0 ? "bg-emerald-500/60" : "bg-red-500/60"} ${isStrong ? "opacity-100" : "opacity-60"}`}
                      style={{ width: `${Math.max(barWidth, 2)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-300 font-mono">
                      {s.correlation > 0 ? "+" : ""}{s.correlation.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-14 text-right text-xs text-gray-500 hidden sm:block">
                    {s.weight > 0 ? "+" : ""}{s.weight}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function MoneyballPage() {
  const [analysis, setAnalysis] = useState<MoneyballAnalysis | null>(null);
  const [correlations, setCorrelations] = useState<MoneyballCorrelations | null>(null);
  const [activeTab, setActiveTab] = useState("alpha");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMoneyballAnalysis(1),
      getMoneyballCorrelations(),
    ])
      .then(([a, c]) => {
        setAnalysis(a);
        setCorrelations(c);
        if (a && (!a.players || a.players.length === 0)) {
          setError("Nenhum jogador encontrado. Execute a sincronização de dados primeiro (incluindo dados históricos).");
        }
      })
      .catch(err => setError(err.message || "Erro ao carregar análise"))
      .finally(() => setLoading(false));
  }, []);

  const summary = analysis?.summary;
  const players = analysis?.players || [];
  const avgAlpha = analysis?.position_avg_alpha || {};

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 animate-pulse">
        <div className="h-48 bg-gray-800/50 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-800/30 rounded-xl" />)}
        </div>
        <div className="h-96 bg-gray-800/30 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-200 mb-2">Erro na Análise</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-gray-900 to-gray-950 border border-emerald-500/10">
        <div className="field-pattern absolute inset-0 opacity-5" />
        <div className="relative p-6 md:p-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CircleDollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Moneyball Analytics</h1>
              <p className="text-xs text-emerald-500/70 font-mono mt-0.5">ANALYTICAL ENGINE v1.0</p>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl text-sm md:text-base leading-relaxed">
            &ldquo;Não é sobre quem é famoso. É sobre quem produz.&rdquo; — Encontre valor onde o mercado não vê.
            Análise estatística inspirada no <span className="text-emerald-400 font-medium">Moneyball</span>: xPts,
            alpha, regressão à média, scouts que realmente importam e eficiência por cartoleta.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <MoneyballStatCard icon={Target} label="Analisados" value={summary.total_players} sub="jogadores com dados" />
          <MoneyballStatCard icon={CircleDollarSign} label="Subvalorizados" value={summary.undervalued_count} sub="alpha acima da média" color="text-emerald-400" />
          <MoneyballStatCard icon={Sparkles} label="Gems" value={summary.gems_count} sub="C$ ≤ 12 com potencial" color="text-amber-400" />
          <MoneyballStatCard icon={Trophy} label="Top Alpha" value={summary.top_alpha?.apelido || "—"} sub={summary.top_alpha ? `α ${summary.top_alpha.alpha.toFixed(2)} · ${summary.top_alpha.posicao}` : ""} color="text-green-400" />
          <MoneyballStatCard icon={Zap} label="Top Momentum" value={summary.top_momentum?.apelido || "—"} sub={summary.top_momentum ? `+${summary.top_momentum.momentum.toFixed(0)}% · ${summary.top_momentum.posicao}` : ""} color="text-orange-400" />
        </div>
      )}

      {/* Tab Bar */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-800/30 text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 6)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description */}
      <p className="text-xs text-gray-600">
        {TABS.find(t => t.id === activeTab)?.desc}
      </p>

      {/* Tab Content */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        {activeTab === "alpha" && <AlphaTable players={players} avgAlpha={avgAlpha} />}
        {activeTab === "gems" && <GemsTable players={players} />}
        {activeTab === "regression" && <RegressionTable players={players} />}
        {activeTab === "momentum" && <MomentumTable players={players} />}
        {activeTab === "consistency" && <ConsistencyTable players={players} />}
        {activeTab === "correlations" && <CorrelationsView correlations={correlations} />}
      </div>

      {/* Methodology Footer */}
      <div className="glass-card rounded-xl p-4 md:p-6 text-xs text-gray-500">
        <h4 className="text-gray-400 font-semibold mb-2 text-sm">📖 Metodologia Moneyball</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong className="text-gray-400">xPts (Expected Points)</strong>
            <p>Pontos esperados calculados a partir da produção média de scouts × pesos oficiais do Cartola FC. Mede a produção &quot;real&quot; independente de sorte.</p>
          </div>
          <div>
            <strong className="text-gray-400">Alpha (α)</strong>
            <p>Razão xPts/preço. Quanto maior, mais valor por cartoleta. Jogadores com α acima da média da posição estão subvalorizados — o Moneyball aplicado ao Cartola.</p>
          </div>
          <div>
            <strong className="text-gray-400">Regressão à Média</strong>
            <p>Desvio entre pontuação real e xPts esperado, em desvios padrão. Valores positivos indicam jogadores &quot;azarados&quot; que tendem a subir — sinal de compra.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
