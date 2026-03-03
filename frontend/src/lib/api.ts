// NEXT_PUBLIC_ vars are inlined at build time by Next.js
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── Mercado ─────────────────────────────────────────────────────
export async function getMercadoStatus() {
  return fetcher<MercadoStatus>("/api/v1/mercado/status");
}

// ── Atletas ─────────────────────────────────────────────────────
export async function getAtletas(params?: AtletaQueryParams) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  if (params?.clube_id) qs.set("clube_id", String(params.clube_id));
  if (params?.posicao_id) qs.set("posicao_id", String(params.posicao_id));
  if (params?.status_id) qs.set("status_id", String(params.status_id));
  if (params?.ordem) qs.set("ordem", params.ordem);
  if (params?.direcao) qs.set("direcao", params.direcao);
  if (params?.busca) qs.set("busca", params.busca);
  return fetcher<AtletaList>(`/api/v1/atletas?${qs.toString()}`);
}

export async function getAtleta(id: number) {
  return fetcher<Atleta>(`/api/v1/atletas/${id}`);
}

// ── Clubes ──────────────────────────────────────────────────────
export async function getClubes() {
  return fetcher<ClubeList>("/api/v1/clubes");
}

// ── Rodadas ─────────────────────────────────────────────────────
export async function getRodadas() {
  return fetcher<RodadaList>("/api/v1/rodadas");
}

// ── Partidas ────────────────────────────────────────────────────
export async function getPartidas(rodada_id?: number) {
  const qs = rodada_id ? `?rodada_id=${rodada_id}` : "";
  return fetcher<PartidaList>(`/api/v1/partidas${qs}`);
}

// ── Analytics ───────────────────────────────────────────────────
export async function getAtletaAnalytics(id: number) {
  return fetcher<AtletaAnalytics>(`/api/v1/analytics/atleta/${id}`);
}

export async function getClubeAnalytics(id: number) {
  return fetcher<ClubeAnalytics>(`/api/v1/analytics/clube/${id}`);
}

export async function getRankingPontuadores(limit = 20) {
  return fetcher<RankingAtleta[]>(`/api/v1/analytics/rankings/pontuadores?limit=${limit}`);
}

export async function getRankingValorizacoes(limit = 20) {
  return fetcher<RankingAtleta[]>(`/api/v1/analytics/rankings/valorizacoes?limit=${limit}`);
}

export async function getRankingCustoBeneficio(limit = 20) {
  return fetcher<RankingAtleta[]>(`/api/v1/analytics/rankings/custo-beneficio?limit=${limit}`);
}

// ── Sync ────────────────────────────────────────────────────────
export async function triggerSync() {
  return fetcher("/api/v1/sync/full", { method: "POST" });
}

// ── Predictions ─────────────────────────────────────────────────
export async function getPrediction(atletaId: number) {
  return fetcher<PlayerPrediction>(`/api/v1/predictions/player/${atletaId}`);
}

export async function getAllPredictions(limit = 50) {
  return fetcher<{ predictions: PlayerPrediction[]; total: number }>(
    `/api/v1/predictions/all?limit=${limit}`
  );
}

export async function getPredictionsByPosition(posicaoId: number, limit = 20) {
  return fetcher<PlayerPrediction[]>(
    `/api/v1/predictions/position/${posicaoId}?limit=${limit}`
  );
}

export async function getPositionRankings() {
  return fetcher<PositionRankings>(`/api/v1/predictions/position-rankings`);
}

export async function getScoutProfile(atletaId: number) {
  return fetcher<ScoutProfileData>(`/api/v1/predictions/scout-profile/${atletaId}`);
}

export async function buildLineup(params: LineupParams) {
  const qs = new URLSearchParams();
  qs.set("budget", String(params.budget || 140));
  qs.set("formation", params.formation || "4-4-2");
  qs.set("strategy", params.strategy || "balanced");
  return fetcher<LineupResponse>(`/api/v1/predictions/lineup?${qs.toString()}`, {
    method: "POST",
  });
}

// ── Moneyball API ───────────────────────────────────────────────

export async function getMoneyballAnalysis(minJogos: number = 3) {
  return fetcher<MoneyballAnalysis>(`/api/v1/moneyball/analysis?min_jogos=${minJogos}`);
}

export async function getMoneyballCorrelations() {
  return fetcher<MoneyballCorrelations>(`/api/v1/moneyball/correlations`);
}

// ── Types ───────────────────────────────────────────────────────
export interface MercadoStatus {
  rodada_atual: number;
  status_mercado: number;
  status_label: string;
  temporada: number;
  game_over: boolean;
  times_escalados: number;
  fechamento_timestamp?: number;
  atualizado_em?: string;
}

export interface Atleta {
  id: number;
  slug: string;
  apelido: string;
  apelido_abreviado: string;
  nome: string;
  foto: string | null;
  clube_id: number;
  posicao_id: number;
  status_id: number;
  pontos_num: number;
  media_num: number;
  preco_num: number;
  variacao_num: number;
  jogos_num: number;
  entrou_em_campo: boolean;
  clube_nome?: string | null;
  posicao_nome?: string | null;
}

export interface AtletaList {
  atletas: Atleta[];
  total: number;
  page: number;
  per_page: number;
}

export interface AtletaQueryParams {
  page?: number;
  per_page?: number;
  clube_id?: number;
  posicao_id?: number;
  status_id?: number;
  ordem?: string;
  direcao?: string;
  busca?: string;
}

export interface Clube {
  id: number;
  nome: string;
  nome_fantasia: string;
  slug: string;
  escudo_30: string | null;
  escudo_45: string | null;
  escudo_60: string | null;
}

export interface ClubeList {
  clubes: Clube[];
  total: number;
}

export interface Rodada {
  id: number;
  inicio: string;
  fim: string;
}

export interface RodadaList {
  rodadas: Rodada[];
  total: number;
}

export interface Partida {
  id: number;
  rodada_id: number;
  clube_casa_id: number;
  clube_visitante_id: number;
  clube_casa_posicao: number | null;
  clube_visitante_posicao: number | null;
  placar_oficial_mandante: number | null;
  placar_oficial_visitante: number | null;
  local: string | null;
  partida_data: string;
  valida: boolean;
  aproveitamento_mandante: string[] | null;
  aproveitamento_visitante: string[] | null;
  clube_casa_nome?: string | null;
  clube_visitante_nome?: string | null;
}

export interface PartidaList {
  partidas: Partida[];
  rodada: number;
  total: number;
}

export interface AtletaAnalytics {
  atleta_id: number;
  apelido: string;
  media: number;
  desvio_padrao: number;
  regularidade: number;
  pontos_por_cartoleta: number;
  scout_medio: Record<string, number>;
  tendencia_preco: number[];
  ultimos_5_pontos: number[];
  projecao: number;
}

export interface ClubeAnalytics {
  clube_id: number;
  nome: string;
  media_pontuacao: number;
  total_gols: number;
  total_assistencias: number;
  jogadores_provaveis: number;
}

export interface RankingAtleta {
  atleta_id: number;
  apelido: string;
  foto: string | null;
  clube_nome: string;
  clube_escudo: string;
  posicao?: string;
  media: number;
  preco: number;
  jogos?: number;
  pontos?: number;
  variacao?: number;
  pontos_por_cartoleta?: number;
}

// ── Prediction Types ────────────────────────────────────────────

export interface PlayerPrediction {
  atleta_id: number;
  apelido: string;
  foto: string | null;
  clube_nome: string;
  clube_escudo: string;
  posicao: string;
  posicao_nome: string;
  preco: number;
  media_geral: number;
  jogos: number;
  prediction: {
    score: number;
    min_score: number;
    max_score: number;
    confidence: number;
    method_breakdown: {
      weighted_avg: number;
      scout_projection: number;
      historic_avg: number;
      form_factor: number;
      opponent_factor: number;
    };
  };
  consistency: {
    cv: number;
    desvio_padrao: number;
    rating: string;
    acima_media_pct: number;
    pontuou_positivo_pct: number;
  };
  form: {
    last_5: number[];
    trend: string;
    form_factor: number;
  };
  risk: {
    label: string;
    volatility: number;
    min_expected: number;
    max_expected: number;
  };
  value: {
    preco: number;
    pontos_por_cartoleta: number;
    rating: string;
  };
}

export interface LineupPlayer {
  atleta_id: number;
  apelido: string;
  foto: string | null;
  clube_nome: string;
  clube_escudo: string;
  posicao: string;
  posicao_nome: string;
  preco: number;
  media: number;
  projecao: number;
  confidence: number;
  min_score: number;
  max_score: number;
  risk_label: string;
}

export interface LineupResponse {
  success: boolean;
  formation: string;
  strategy: string;
  budget: number;
  total_price: number;
  remaining_budget: number;
  total_prediction: number;
  total_media: number;
  players_count: number;
  players: LineupPlayer[];
  message?: string;
}

export interface LineupParams {
  budget?: number;
  formation?: string;
  strategy?: string;
}

export interface PositionRankingPlayer {
  atleta_id: number;
  apelido: string;
  foto: string | null;
  clube_nome: string;
  clube_escudo: string;
  preco: number;
  media: number;
  projecao: number;
  confidence: number;
  consistency: string;
  trend: string;
  value_rating: string;
}

export interface PositionRankings {
  [key: string]: {
    posicao: string;
    jogadores: PositionRankingPlayer[];
  };
}

export interface ScoutProfileData {
  jogos_analisados: number;
  profile: {
    gols: number;
    assistencias: number;
    finalizacoes: number;
    desarmes: number;
    faltas_sofridas: number;
    defesas: number;
    cartoes: number;
    vitorias_pct: number;
    saldo_gol_pct: number;
  };
  contribution: Record<string, { total: number; points: number; per_game: number }>;
}

// ── Moneyball Types ─────────────────────────────────────────────

export interface MoneyballPlayer {
  atleta_id: number;
  apelido: string;
  nome: string;
  foto: string | null;
  clube_nome: string;
  clube_abreviacao: string;
  posicao: string;
  posicao_nome: string;
  preco: number;
  media: number;
  jogos: number;
  xpts: number;
  alpha: number;
  alpha_vs_pos: number;
  is_undervalued: boolean;
  value_score: number;
  std_dev: number;
  consistency: number;
  momentum: number;
  trend_pct: number;
  avg_last_3: number;
  avg_last_5: number;
  pos_pct: number;
  floor: number;
  ceiling: number;
  regression: number;
  sharpe: number;
  vic_pct: number;
  variacao: number;
  points_history: number[];
  scout_avgs: Record<string, number>;
}

export interface MoneyballSummary {
  total_players: number;
  avg_alpha: number;
  undervalued_count: number;
  gems_count: number;
  top_alpha: MoneyballPlayerSummary | null;
  top_gem: MoneyballPlayerSummary | null;
  top_momentum: MoneyballPlayerSummary | null;
  most_consistent: MoneyballPlayerSummary | null;
  biggest_buy_signal: MoneyballPlayerSummary | null;
  best_sharpe: MoneyballPlayerSummary | null;
}

export interface MoneyballPlayerSummary {
  atleta_id: number;
  apelido: string;
  clube_nome: string;
  posicao: string;
  preco: number;
  media: number;
  xpts: number;
  alpha: number;
  momentum: number;
  consistency: number;
  regression: number;
  sharpe: number;
}

export interface MoneyballAnalysis {
  players: MoneyballPlayer[];
  summary: MoneyballSummary;
  position_avg_alpha: Record<string, number>;
}

export interface ScoutCorrelation {
  correlation: number;
  label: string;
  weight: number;
  impact: number;
  avg: number;
  is_positive: boolean;
}

export interface PositionCorrelation {
  posicao_nome: string;
  sample_size: number;
  scouts: Record<string, ScoutCorrelation>;
}

export interface MoneyballCorrelations {
  [position: string]: PositionCorrelation;
}
