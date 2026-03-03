"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Crown,
  Sparkles,
  Flame,
  ShieldAlert,
  Rocket,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Coins,
  Gem,
  Star,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getRoundTips,
  RoundTips,
  TipPlayer,
  QuickLineup,
} from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────

const POS_COLORS: Record<string, string> = {
  GOL: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LAT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ZAG: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEI: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ATA: "bg-red-500/20 text-red-400 border-red-500/30",
  TEC: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const POS_ORDER = ["GOL", "ZAG", "LAT", "MEI", "ATA", "TEC"];

function PosBadge({ pos }: { pos: string }) {
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POS_COLORS[pos] || POS_COLORS["TEC"]}`}>
      {pos}
    </span>
  );
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-[2px] h-5">
      {data.map((v, i) => (
        <div key={i} className={`w-1 rounded-t ${v > 0 ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ height: `${Math.max(6, ((v - min) / range) * 100)}%` }} />
      ))}
    </div>
  );
}

function momentumIcon(m: number) {
  if (m > 10) return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
  if (m < -10) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <ChevronRight className="w-3.5 h-3.5 text-gray-500" />;
}

function PlayerCard({ player, highlight = false, showReasons = false, compact = false }: {
  player: TipPlayer; highlight?: boolean; showReasons?: boolean; compact?: boolean;
}) {
  return (
    <div className={`rounded-xl border transition-all ${
      highlight
        ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20"
        : "bg-gray-800/30 border-gray-800 hover:border-gray-700"
    } ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PosBadge pos={player.posicao} />
            <span className={`font-semibold truncate ${compact ? "text-sm" : ""} text-gray-200`}>
              {player.apelido}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>{player.clube_abreviacao}</span>
            <span>·</span>
            <span>C$ {player.preco.toFixed(1)}</span>
            <span>·</span>
            <span>{player.jogos}j</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500">xPts</div>
          <div className="text-lg font-bold text-blue-400">{player.xpts.toFixed(1)}</div>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div>
            <div className="text-[10px] text-gray-600 uppercase">Média</div>
            <div className="text-sm font-medium text-gray-300">{player.media.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-600 uppercase">Últ. 3</div>
            <div className="text-sm font-medium text-amber-400">{player.avg_last_3.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-600 uppercase">Mom.</div>
            <div className="text-sm font-medium flex items-center gap-1">
              {momentumIcon(player.momentum)}
              <span className={player.momentum > 0 ? "text-emerald-400" : player.momentum < -10 ? "text-red-400" : "text-gray-400"}>
                {player.momentum > 0 ? "+" : ""}{player.momentum.toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-600 uppercase">Consist.</div>
            <div className={`text-sm font-medium ${player.consistency >= 60 ? "text-emerald-400" : player.consistency >= 40 ? "text-yellow-400" : "text-red-400"}`}>
              {player.consistency}%
            </div>
          </div>
        </div>
      )}

      {!compact && player.points_history.length > 0 && (
        <div className="mt-2">
          <MiniSparkline data={player.points_history} />
        </div>
      )}

      {showReasons && player.razoes && player.razoes.length > 0 && (
        <div className="mt-3 space-y-1">
          {player.razoes.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AvoidCard({ player }: { player: TipPlayer }) {
  return (
    <div className="rounded-xl border bg-red-500/5 border-red-500/15 p-3 hover:border-red-500/30 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PosBadge pos={player.posicao} />
            <span className="font-medium text-sm text-gray-300 truncate">{player.apelido}</span>
          </div>
          <div className="text-[11px] text-gray-500">{player.clube_abreviacao} · C$ {player.preco.toFixed(1)}</div>
        </div>
        <XCircle className="w-5 h-5 text-red-400/60 shrink-0" />
      </div>
      {player.razoes && player.razoes.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {player.razoes.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-red-400/80">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function DicasPage() {
  const [tips, setTips] = useState<RoundTips | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState(140);
  const [formation, setFormation] = useState("4-4-2");

  const loadTips = useCallback(() => {
    setLoading(true);
    setError(null);
    getRoundTips(budget, formation)
      .then(setTips)
      .catch(err => setError(err.message || "Erro ao carregar dicas"))
      .finally(() => setLoading(false));
  }, [budget, formation]);

  useEffect(() => { loadTips(); }, [loadTips]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 animate-pulse">
        <div className="h-40 bg-gray-800/50 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-gray-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-200 mb-2">Erro</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!tips) return null;

  const { capitao, vice_capitao, picks, moonshots, evitar, tiers, escalacao, resumo } = tips;

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/60 via-gray-900 to-gray-950 border border-amber-500/10">
        <div className="field-pattern absolute inset-0 opacity-5" />
        <div className="relative p-6 md:p-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dicas da Rodada</h1>
              <p className="text-xs text-amber-500/70 font-mono mt-0.5">QUEM ESCALAR · SMART PICKS</p>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Recomendações inteligentes baseadas em xPts, momentum, regressão à média e consistência.
            Capitão, melhores picks por posição, moonshots e alertas — tudo em um lugar.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Orçamento:</label>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
                className="w-20 px-2 py-1.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500/50" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Formação:</label>
              <select value={formation} onChange={e => setFormation(e.target.value)}
                className="px-2 py-1.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500/50">
                {["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <button onClick={loadTips}
              className="px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors">
              Atualizar
            </button>
          </div>

          {/* Quick Stats */}
          {resumo && (
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
              <span>{resumo.total_analisados} jogadores analisados</span>
              <span>·</span>
              <span className="text-emerald-500">{resumo.jogadores_com_momentum_positivo} em alta</span>
              <span>·</span>
              <span className="text-blue-400">{resumo.jogadores_subvalorizados} subvalorizados</span>
              <span>·</span>
              <span className="text-amber-400">{resumo.moonshots_disponiveis} moonshots</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Captain Section ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capitao && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-amber-400">Capitão Recomendado</h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">2x</span>
            </div>
            <PlayerCard player={capitao} highlight showReasons />
          </div>
        )}
        {vice_capitao && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-400">Vice-Capitão</h2>
              <span className="text-[10px] bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/30 font-bold">backup</span>
            </div>
            <PlayerCard player={vice_capitao} showReasons />
          </div>
        )}
      </div>

      {/* ── Position Picks ────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-gray-200">Melhores por Posição</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POS_ORDER.filter(pos => picks[pos] && picks[pos].length > 0).map(pos => (
            <div key={pos} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PosBadge pos={pos} />
                <span className="text-sm font-semibold text-gray-300">
                  {picks[pos]?.[0]?.posicao_nome || pos}
                </span>
              </div>
              <div className="space-y-2">
                {picks[pos].map((p, i) => (
                  <div key={p.atleta_id}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      i === 0 ? "bg-blue-500/10 border border-blue-500/15" : "bg-gray-800/30"
                    }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold w-5 ${i === 0 ? "text-blue-400" : "text-gray-600"}`}>{i + 1}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-200 truncate">{p.apelido}</div>
                        <div className="text-[10px] text-gray-500">{p.clube_abreviacao} · C$ {p.preco.toFixed(1)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {momentumIcon(p.momentum)}
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-400">{p.xpts.toFixed(1)}</div>
                        <div className="text-[10px] text-gray-600">xPts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Moonshots & Avoid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moonshots */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-400">Moonshots</h2>
            <span className="text-[10px] text-gray-500 ml-1">Alto risco, alta recompensa</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {moonshots.map(p => (
              <PlayerCard key={p.atleta_id} player={p} compact />
            ))}
          </div>
          {moonshots.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum moonshot identificado.</p>
          )}
        </div>

        {/* Avoid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Evitar</h2>
            <span className="text-[10px] text-gray-500 ml-1">Sinais negativos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {evitar.map(p => (
              <AvoidCard key={p.atleta_id} player={p} />
            ))}
          </div>
          {evitar.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum alerta no momento.</p>
          )}
        </div>
      </div>

      {/* ── Budget Tiers ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-gray-200">Por Faixa de Preço</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Baratos */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gem className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-green-400">Baratos (≤ C$ 8)</h3>
            </div>
            <div className="space-y-2">
              {tiers.baratos.map(p => (
                <div key={p.atleta_id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-800/30">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">{p.apelido}</div>
                    <div className="text-[10px] text-gray-500">{p.posicao} · {p.clube_abreviacao} · C$ {p.preco.toFixed(1)}</div>
                  </div>
                  <span className="text-sm font-bold text-blue-400 shrink-0">{p.xpts.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Médio */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">Médio (C$ 8–16)</h3>
            </div>
            <div className="space-y-2">
              {tiers.medio.map(p => (
                <div key={p.atleta_id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-800/30">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">{p.apelido}</div>
                    <div className="text-[10px] text-gray-500">{p.posicao} · {p.clube_abreviacao} · C$ {p.preco.toFixed(1)}</div>
                  </div>
                  <span className="text-sm font-bold text-blue-400 shrink-0">{p.xpts.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-purple-400">Premium (&gt; C$ 16)</h3>
            </div>
            <div className="space-y-2">
              {tiers.premium.map(p => (
                <div key={p.atleta_id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-800/30">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">{p.apelido}</div>
                    <div className="text-[10px] text-gray-500">{p.posicao} · {p.clube_abreviacao} · C$ {p.preco.toFixed(1)}</div>
                  </div>
                  <span className="text-sm font-bold text-blue-400 shrink-0">{p.xpts.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Lineup ──────────────────────────────── */}
      {escalacao && escalacao.players.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-gray-200">Escalação Sugerida</h2>
            <span className="text-xs text-gray-500">· {escalacao.formation}</span>
          </div>
          <div className="glass-card rounded-xl p-4 md:p-6">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-3 border-b border-gray-800">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Custo Total</div>
                <div className="text-lg font-bold text-gray-200">C$ {escalacao.total_price.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Sobra</div>
                <div className="text-lg font-bold text-emerald-400">C$ {escalacao.remaining.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">xPts Total</div>
                <div className="text-lg font-bold text-blue-400">{escalacao.total_xpts.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Jogadores</div>
                <div className="text-lg font-bold text-gray-300">{escalacao.count}</div>
              </div>
            </div>

            {/* Lineup grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {escalacao.players.map(p => (
                <div key={p.atleta_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-800 hover:border-gray-700 transition-colors">
                  <PosBadge pos={p.posicao} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-200 truncate">{p.apelido}</div>
                    <div className="text-[10px] text-gray-500">{p.clube_abreviacao} · C$ {p.preco.toFixed(1)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-blue-400">{p.xpts.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Methodology Note ──────────────────────────── */}
      <div className="glass-card rounded-xl p-4 md:p-6 text-xs text-gray-500">
        <h4 className="text-gray-400 font-semibold mb-2 text-sm">📖 Como funciona</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong className="text-gray-400">Capitão</strong>
            <p>Calculado por uma fórmula que combina xPts (30%), forma recente (25%), média (15%), teto (10%), consistência (10%) e momentum (10%). Maximiza valor do 2x.</p>
          </div>
          <div>
            <strong className="text-gray-400">Picks por Posição</strong>
            <p>Ranking combinado de produção de scouts (xPts), forma recente, consistência, Sharpe ratio (retorno ajustado ao risco) e eficiência de custo (alpha).</p>
          </div>
          <div>
            <strong className="text-gray-400">Moonshots & Evitar</strong>
            <p>Moonshots: alto teto + sinal de compra da regressão + momentum positivo. Evitar: overperformers (queda provável) + momentum negativo + inconsistência.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
