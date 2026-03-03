// Use relative paths — Next.js rewrites proxy /api/* to the backend
const API_BASE = "";

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
