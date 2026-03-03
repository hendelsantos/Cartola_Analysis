"use client";

import { useEffect, useState } from "react";
import {
  getAllPredictions,
  getPositionRankings,
  getScoutProfile,
  type PlayerPrediction,
  type PositionRankings,
  type ScoutProfileData,
} from "@/lib/api";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  BarChart3,
  Target,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  Activity,
} from "lucide-react";

const positionColors: Record<string, string> = {
  GOL: "bg-yellow-500/20 text-yellow-400",
  ZAG: "bg-blue-500/20 text-blue-400",
  LAT: "bg-cyan-500/20 text-cyan-400",
  MEI: "bg-green-500/20 text-green-400",
  ATA: "bg-red-500/20 text-red-400",
  TEC: "bg-purple-500/20 text-purple-400",
};

const riskColors: Record<string, string> = {
  baixo: "success",
  moderado: "warning",
  alto: "danger",
  muito_alto: "danger",
  desconhecido: "muted",
};

const positionNames: Record<string, string> = {
  goleiros: "Goleiros",
  zagueiros: "Zagueiros",
  laterais: "Laterais",
  meias: "Meias",
  atacantes: "Atacantes",
  tecnicos: "Técnicos",
};

export default function PrevisoesPage() {
  const [predictions, setPredictions] = useState<PlayerPrediction[]>([]);
  const [posRankings, setPosRankings] = useState<PositionRankings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"projecao" | "media" | "confidence" | "preco">("projecao");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [scoutProfile, setScoutProfile] = useState<ScoutProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [predsResult, ranks] = await Promise.all([
          getAllPredictions(200),
          getPositionRankings(),
        ]);
        setPredictions(predsResult.predictions);
        setPosRankings(ranks);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadScoutProfile(atleta_id: number) {
    if (selectedPlayer === atleta_id) {
      setSelectedPlayer(null);
      setScoutProfile(null);
      return;
    }
    setSelectedPlayer(atleta_id);
    setProfileLoading(true);
    try {
      const profile = await getScoutProfile(atleta_id);
      setScoutProfile(profile);
    } catch {
      setScoutProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  const filtered = predictions
    .filter((p) => {
      const matchSearch = p.apelido
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchPos =
        posFilter === "all" ||
        p.posicao.toLowerCase() === posFilter.toLowerCase();
      return matchSearch && matchPos;
    })
    .sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case "projecao":
          aVal = a.prediction.score;
          bVal = b.prediction.score;
          break;
        case "media":
          aVal = a.media_geral;
          bVal = b.media_geral;
          break;
        case "confidence":
          aVal = a.prediction.confidence;
          bVal = b.prediction.confidence;
          break;
        case "preco":
          aVal = a.preco;
          bVal = b.preco;
          break;
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (
      sortDir === "desc" ? (
        <ChevronDown className="ml-1 inline h-3 w-3" />
      ) : (
        <ChevronUp className="ml-1 inline h-3 w-3" />
      )
    ) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Previsões</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const top5 = [...predictions]
    .sort((a, b) => b.prediction.score - a.prediction.score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="field-pattern relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-8">
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl sm:h-48 sm:w-48" />
        <div className="relative z-10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">
            Machine Learning
          </p>
          <h1 className="mt-1 text-xl font-extrabold text-foreground sm:text-2xl">
            Previsões de Pontuação
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Projeções baseadas em média ponderada, scouts e dificuldade do adversário
          </p>
        </div>
      </div>

      {/* Top 5 Highlight */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {top5.map((p, i) => (
          <div
            key={p.atleta_id}
            className={`rounded-2xl border p-3 transition-all duration-300 hover:scale-[1.02] sm:p-4 ${
              i === 0
                ? "border-primary/50 bg-gradient-to-br from-primary/10 to-card glow-primary"
                : "border-border/60 bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">#{i + 1}</span>
              {i === 0 && <Star className="h-4 w-4 text-primary" />}
            </div>
            <p className="mt-1 truncate font-semibold text-foreground">
              {p.apelido}
            </p>
            <p className="text-xs text-muted-foreground">{p.clube_nome}</p>
            <p className="mt-2 text-xl font-bold text-primary">
              {formatNumber(p.prediction.score)} pts
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex rounded-md px-1.5 py-0.5 text-xs font-bold ${
                  positionColors[p.posicao.toUpperCase()] ||
                  "bg-muted text-muted-foreground"
                }`}
              >
                {p.posicao.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(p.preco)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Position Rankings */}
      {posRankings && (
        <Card title="Melhores por Posição" subtitle="Top projeções por posição">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(posRankings)
              .filter(([_, v]) => v && v.jogadores && v.jogadores.length > 0)
              .map(([posKey, posData]) => (
                <div
                  key={posKey}
                  className="rounded-lg border border-border/50 p-3"
                >
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    {positionNames[posKey] || posData.posicao}
                  </h4>
                  <div className="space-y-1">
                    {posData.jogadores.slice(0, 5).map((pl, i) => (
                      <div
                        key={pl.atleta_id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-4 text-muted-foreground">
                            {i + 1}.
                          </span>
                          <span className="text-foreground">{pl.apelido}</span>
                        </span>
                        <span className="font-semibold text-primary">
                          {formatNumber(pl.projecao)} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2 pl-9 pr-3 text-sm text-foreground"
          />
        </div>
        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
        >
          <option value="all">Todas posições</option>
          <option value="gol">Goleiro</option>
          <option value="zag">Zagueiro</option>
          <option value="lat">Lateral</option>
          <option value="mei">Meia</option>
          <option value="ata">Atacante</option>
          <option value="tec">Técnico</option>
        </select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} jogadores
        </span>
      </div>

      {/* Full Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Pos</th>
                <th className="pb-3 font-medium">Jogador</th>
                <th className="pb-3 font-medium">Clube</th>
                <th
                  className="cursor-pointer pb-3 text-right font-medium hover:text-foreground"
                  onClick={() => toggleSort("preco")}
                >
                  Preço
                  <SortIcon col="preco" />
                </th>
                <th
                  className="cursor-pointer pb-3 text-right font-medium hover:text-foreground"
                  onClick={() => toggleSort("media")}
                >
                  Média
                  <SortIcon col="media" />
                </th>
                <th
                  className="cursor-pointer pb-3 text-right font-medium hover:text-foreground"
                  onClick={() => toggleSort("projecao")}
                >
                  Projeção
                  <SortIcon col="projecao" />
                </th>
                <th
                  className="cursor-pointer pb-3 text-right font-medium hover:text-foreground"
                  onClick={() => toggleSort("confidence")}
                >
                  Confiança
                  <SortIcon col="confidence" />
                </th>
                <th className="pb-3 text-center font-medium">Risco</th>
                <th className="pb-3 text-center font-medium">Perfil</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((p) => (
                <>
                  <tr
                    key={p.atleta_id}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                          positionColors[p.posicao.toUpperCase()] ||
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.posicao.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-foreground">
                      {p.apelido}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {p.clube_nome}
                    </td>
                    <td className="py-3 text-right text-foreground">
                      {formatCurrency(p.preco)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {formatNumber(p.media_geral)}
                    </td>
                    <td className="py-3 text-right font-semibold text-primary">
                      {formatNumber(p.prediction.score)}
                    </td>
                    <td className="py-3 text-right text-foreground">
                      {formatNumber(p.prediction.confidence)}%
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={
                          (riskColors[p.risk.label] as
                            | "success"
                            | "warning"
                            | "danger"
                            | "muted") || "muted"
                        }
                      >
                        {p.risk.label}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => loadScoutProfile(p.atleta_id)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  {selectedPlayer === p.atleta_id && (
                    <tr key={`scout-${p.atleta_id}`}>
                      <td colSpan={9} className="bg-muted/30 px-4 py-3">
                        {profileLoading ? (
                          <p className="text-sm text-muted-foreground">
                            Carregando perfil...
                          </p>
                        ) : scoutProfile ? (
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                              <h5 className="mb-2 text-xs font-semibold text-foreground">
                                Decomposição da Projeção
                              </h5>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Média Ponderada
                                  </span>
                                  <span className="text-foreground">
                                    {formatNumber(
                                      p.prediction.method_breakdown.weighted_avg
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Projeção Scout
                                  </span>
                                  <span className="text-foreground">
                                    {formatNumber(
                                      p.prediction.method_breakdown.scout_projection
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Fator Forma
                                  </span>
                                  <span className="text-foreground">
                                    {formatNumber(
                                      p.prediction.method_breakdown.form_factor
                                    )}
                                    x
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Fator Adversário
                                  </span>
                                  <span className="text-foreground">
                                    {formatNumber(
                                      p.prediction.method_breakdown.opponent_factor
                                    )}
                                    x
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h5 className="mb-2 text-xs font-semibold text-foreground">
                                Contribuições por Scout
                              </h5>
                              <div className="space-y-1 text-xs">
                                {Object.entries(scoutProfile.contribution)
                                  .filter(([_, v]) => v.points > 0)
                                  .sort(([, a], [, b]) => b.points - a.points)
                                  .slice(0, 6)
                                  .map(([name, v]) => (
                                    <div
                                      key={name}
                                      className="flex justify-between"
                                    >
                                      <span className="text-muted-foreground">
                                        {name}
                                      </span>
                                      <span className="text-success">
                                        +{formatNumber(v.points)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="mb-2 text-xs font-semibold text-foreground">
                                Scouts Negativos
                              </h5>
                              <div className="space-y-1 text-xs">
                                {Object.entries(scoutProfile.contribution)
                                  .filter(([_, v]) => v.points < 0)
                                  .sort(([, a], [, b]) => a.points - b.points)
                                  .slice(0, 6)
                                  .map(([name, v]) => (
                                    <div
                                      key={name}
                                      className="flex justify-between"
                                    >
                                      <span className="text-muted-foreground">
                                        {name}
                                      </span>
                                      <span className="text-danger">
                                        {formatNumber(v.points)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="mb-2 text-xs font-semibold text-foreground">
                                Estatísticas
                              </h5>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Jogos Analisados
                                  </span>
                                  <span className="text-foreground">
                                    {scoutProfile.jogos_analisados}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Consistência
                                  </span>
                                  <span className="text-foreground">
                                    {p.consistency.rating}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Pts/C$
                                  </span>
                                  <span className="text-foreground">
                                    {formatNumber(p.value.pontos_por_cartoleta)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Sem dados de perfil
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
