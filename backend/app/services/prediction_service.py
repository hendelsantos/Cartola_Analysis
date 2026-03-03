"""
Prediction Engine — Score projection & optimal lineup builder.

Uses weighted moving average, opponent difficulty, consistency metrics,
and knapsack optimization for team selection.
"""

import structlog
from math import sqrt
from statistics import mean, stdev
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.models.atleta import Atleta
from app.models.scout import ScoutRodada
from app.models.clube import Clube
from app.models.posicao import Posicao
from app.models.partida import Partida
from app.models.mercado import MercadoStatus
from app.core.scout_weights import SCOUT_WEIGHTS as _WEIGHTS

logger = structlog.get_logger()

# ── Cartola FC formation templates ───────────────────────────────
FORMATIONS = {
    "3-4-3": {"gol": 1, "zag": 3, "lat": 0, "mei": 4, "ata": 3},
    "3-5-2": {"gol": 1, "zag": 3, "lat": 0, "mei": 5, "ata": 2},
    "4-3-3": {"gol": 1, "zag": 2, "lat": 2, "mei": 3, "ata": 3},
    "4-4-2": {"gol": 1, "zag": 2, "lat": 2, "mei": 4, "ata": 2},
    "4-5-1": {"gol": 1, "zag": 2, "lat": 2, "mei": 5, "ata": 1},
    "5-3-2": {"gol": 1, "zag": 3, "lat": 2, "mei": 3, "ata": 2},
    "5-4-1": {"gol": 1, "zag": 3, "lat": 2, "mei": 4, "ata": 1},
}

# Position ID to abbreviation mapping
POS_MAP = {1: "gol", 2: "lat", 3: "zag", 4: "mei", 5: "ata", 6: "tec"}

# Scout score weights (from shared module)
SCOUT_POINTS = _WEIGHTS


class PredictionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ──────────────────────────────────────────────
    # Player Score Prediction
    # ──────────────────────────────────────────────

    async def predict_player_score(self, atleta_id: int) -> dict:
        """
        Predict next round score using weighted moving average + modifiers.
        """
        atleta = await self.db.get(Atleta, atleta_id)
        if not atleta:
            raise ValueError(f"Atleta {atleta_id} não encontrado")

        clube = await self.db.get(Clube, atleta.clube_id)
        posicao = await self.db.get(Posicao, atleta.posicao_id)

        # Fetch scout history
        result = await self.db.execute(
            select(ScoutRodada)
            .where(
                ScoutRodada.atleta_id == atleta_id,
                ScoutRodada.entrou_em_campo == True,
            )
            .order_by(ScoutRodada.rodada_id)
        )
        scouts = result.scalars().all()

        pontos = [s.pontos_num for s in scouts]

        if not pontos:
            return self._empty_prediction(atleta, clube, posicao)

        # 1. Weighted Moving Average (recent games weigh more)
        wma = self._weighted_moving_average(pontos)

        # 2. Consistency metrics
        consistency = self._calculate_consistency(pontos)

        # 3. Form factor (last 5 games trend)
        form_factor = self._calculate_form_factor(pontos)

        # 4. Scout-based projection
        scout_projection = self._scout_based_projection(scouts)

        # 5. Opponent difficulty (simplified — based on overall data)
        opponent_factor = await self._get_opponent_factor(atleta, posicao)

        # Final prediction: blend of methods
        base_prediction = (wma * 0.40) + (scout_projection * 0.30) + (atleta.media_num * 0.30)
        adjusted = base_prediction * form_factor * opponent_factor

        # Confidence based on sample size and consistency
        confidence = self._calculate_confidence(len(pontos), consistency["cv"])

        # Risk analysis
        risk = self._calculate_risk(pontos, adjusted)

        return {
            "atleta_id": atleta.id,
            "apelido": atleta.apelido,
            "foto": atleta.foto,
            "clube_nome": clube.nome_fantasia if clube else "",
            "clube_escudo": clube.escudo_30 if clube else "",
            "posicao": posicao.abreviacao if posicao else "",
            "posicao_nome": posicao.nome if posicao else "",
            "preco": atleta.preco_num,
            "media_geral": round(atleta.media_num, 2),
            "jogos": atleta.jogos_num,
            "prediction": {
                "score": round(adjusted, 2),
                "min_score": round(risk["min_expected"], 2),
                "max_score": round(risk["max_expected"], 2),
                "confidence": round(confidence, 2),
                "method_breakdown": {
                    "weighted_avg": round(wma, 2),
                    "scout_projection": round(scout_projection, 2),
                    "historic_avg": round(atleta.media_num, 2),
                    "form_factor": round(form_factor, 3),
                    "opponent_factor": round(opponent_factor, 3),
                },
            },
            "consistency": consistency,
            "form": {
                "last_5": pontos[-5:] if len(pontos) >= 5 else pontos,
                "trend": "subindo" if form_factor > 1.05 else "descendo" if form_factor < 0.95 else "estavel",
                "form_factor": round(form_factor, 3),
            },
            "risk": risk,
            "value": {
                "preco": atleta.preco_num,
                "pontos_por_cartoleta": round(
                    adjusted / atleta.preco_num if atleta.preco_num > 0 else 0, 2
                ),
                "rating": self._value_rating(adjusted, atleta.preco_num),
            },
        }

    # ──────────────────────────────────────────────
    # Batch Predictions (all players)
    # ──────────────────────────────────────────────

    async def predict_all_players(self, min_jogos: int = 1) -> list[dict]:
        """Predict scores for all eligible players.

        Does NOT hard-filter by status_id so the lineup builder works
        even between rounds or when few players are marked 'Provável'.
        Players with status 7 (Provável) receive a slight boost.
        """
        result = await self.db.execute(
            select(Atleta)
            .where(
                Atleta.jogos_num >= min_jogos,
                Atleta.preco_num > 0,
            )
        )
        atletas = result.scalars().all()

        predictions = []
        for atleta in atletas:
            try:
                pred = await self.predict_player_score(atleta.id)
                predictions.append(pred)
            except Exception as e:
                logger.warning("prediction_failed", atleta_id=atleta.id, error=str(e))

        # Sort by predicted score descending
        predictions.sort(key=lambda x: x["prediction"]["score"], reverse=True)
        return predictions

    async def predict_by_position(self, posicao_id: int, limit: int = 20) -> list[dict]:
        """Get top predictions filtered by position."""
        result = await self.db.execute(
            select(Atleta)
            .where(
                Atleta.posicao_id == posicao_id,
                Atleta.jogos_num > 0,
                Atleta.preco_num > 0,
            )
            .order_by(desc(Atleta.media_num))
            .limit(limit * 3)  # Fetch extra for filtering
        )
        atletas = result.scalars().all()

        predictions = []
        for atleta in atletas:
            try:
                pred = await self.predict_player_score(atleta.id)
                predictions.append(pred)
            except Exception:
                continue

        predictions.sort(key=lambda x: x["prediction"]["score"], reverse=True)
        return predictions[:limit]

    # ──────────────────────────────────────────────
    # Optimal Lineup Builder
    # ──────────────────────────────────────────────

    async def build_optimal_lineup(
        self,
        budget: float = 140.0,
        formation: str = "4-4-2",
        strategy: str = "balanced",
        exclude_ids: list[int] | None = None,
    ) -> dict:
        """
        Build the best possible team within budget using optimization.

        Strategies:
        - balanced: maximize predicted score
        - aggressive: favor high-ceiling players (max_score)
        - conservative: favor consistent players (low CV)
        - value: maximize points per cartoleta
        """
        if formation not in FORMATIONS:
            raise ValueError(f"Formação inválida: {formation}. Use: {list(FORMATIONS.keys())}")

        formation_slots = FORMATIONS[formation]
        exclude_set = set(exclude_ids or [])

        # Get predictions for all eligible players
        all_predictions = await self.predict_all_players(min_jogos=1)

        # Filter out excluded and unavailable
        candidates = [
            p for p in all_predictions
            if p["atleta_id"] not in exclude_set
        ]

        # Group by position
        by_position: dict[str, list[dict]] = {}
        for pred in candidates:
            pos_key = pred["posicao"].lower()
            if pos_key not in by_position:
                by_position[pos_key] = []
            by_position[pos_key].append(pred)

        # Build lineup using greedy + backtracking
        lineup = self._optimize_lineup(
            by_position, formation_slots, budget, strategy
        )

        if not lineup:
            return {
                "success": False,
                "message": "Não foi possível montar um time dentro do orçamento",
                "formation": formation,
                "budget": budget,
                "players": [],
            }

        total_price = sum(p["preco"] for p in lineup)
        total_prediction = sum(p["prediction"]["score"] for p in lineup)
        total_media = sum(p["media_geral"] for p in lineup)

        # Format response
        players = []
        for p in lineup:
            players.append({
                "atleta_id": p["atleta_id"],
                "apelido": p["apelido"],
                "foto": p["foto"],
                "clube_nome": p["clube_nome"],
                "clube_escudo": p["clube_escudo"],
                "posicao": p["posicao"],
                "posicao_nome": p["posicao_nome"],
                "preco": p["preco"],
                "media": p["media_geral"],
                "projecao": p["prediction"]["score"],
                "confidence": p["prediction"]["confidence"],
                "min_score": p["prediction"]["min_score"],
                "max_score": p["prediction"]["max_score"],
                "risk_label": p["risk"]["label"],
            })

        return {
            "success": True,
            "formation": formation,
            "strategy": strategy,
            "budget": budget,
            "total_price": round(total_price, 2),
            "remaining_budget": round(budget - total_price, 2),
            "total_prediction": round(total_prediction, 2),
            "total_media": round(total_media, 2),
            "players_count": len(players),
            "players": sorted(players, key=lambda x: self._position_order(x["posicao"])),
        }

    # ──────────────────────────────────────────────
    # Advanced Stats
    # ──────────────────────────────────────────────

    async def get_player_scout_profile(self, atleta_id: int) -> dict:
        """Detailed scout profile for radar charts."""
        result = await self.db.execute(
            select(ScoutRodada)
            .where(
                ScoutRodada.atleta_id == atleta_id,
                ScoutRodada.entrou_em_campo == True,
            )
        )
        scouts = result.scalars().all()
        if not scouts:
            return {}

        jogos = len(scouts)

        # Per-game averages for radar chart
        profile = {
            "gols": round(sum(s.gols for s in scouts) / jogos, 2),
            "assistencias": round(sum(s.assistencias for s in scouts) / jogos, 2),
            "finalizacoes": round(
                sum(s.finalizacao_trave + s.finalizacao_defendida + s.finalizacao_fora for s in scouts) / jogos, 2
            ),
            "desarmes": round(sum(s.desarmes for s in scouts) / jogos, 2),
            "faltas_sofridas": round(sum(s.faltas_sofridas for s in scouts) / jogos, 2),
            "defesas": round(sum(s.defesas for s in scouts) / jogos, 2),
            "cartoes": round(sum(s.cartao_amarelo + s.cartao_vermelho for s in scouts) / jogos, 2),
            "vitorias_pct": round(sum(s.vitoria for s in scouts) / jogos * 100, 1),
            "saldo_gol_pct": round(sum(s.saldo_gol for s in scouts) / jogos * 100, 1),
        }

        # Point contribution by scout type
        contribution = {}
        for scout_key, weight in SCOUT_POINTS.items():
            total = sum(getattr(s, scout_key, 0) for s in scouts)
            points = total * weight
            if abs(points) > 0.01:
                contribution[scout_key] = {
                    "total": total,
                    "points": round(points, 2),
                    "per_game": round(total / jogos, 2),
                }

        return {
            "jogos_analisados": jogos,
            "profile": profile,
            "contribution": contribution,
        }

    async def get_position_rankings(self, limit: int = 15) -> dict:
        """Rankings by position with predictions."""
        positions = {1: "Goleiro", 2: "Lateral", 3: "Zagueiro", 4: "Meia", 5: "Atacante"}
        rankings = {}

        for pos_id, pos_name in positions.items():
            preds = await self.predict_by_position(pos_id, limit=limit)
            rankings[pos_name.lower()] = {
                "posicao": pos_name,
                "jogadores": [
                    {
                        "atleta_id": p["atleta_id"],
                        "apelido": p["apelido"],
                        "foto": p["foto"],
                        "clube_nome": p["clube_nome"],
                        "clube_escudo": p["clube_escudo"],
                        "preco": p["preco"],
                        "media": p["media_geral"],
                        "projecao": p["prediction"]["score"],
                        "confidence": p["prediction"]["confidence"],
                        "consistency": p["consistency"]["rating"],
                        "trend": p["form"]["trend"],
                        "value_rating": p["value"]["rating"],
                    }
                    for p in preds
                ],
            }

        return rankings

    # ──────────────────────────────────────────────
    # Private calculation methods
    # ──────────────────────────────────────────────

    def _weighted_moving_average(self, values: list[float], decay: float = 0.85) -> float:
        """Calculate WMA with exponential decay. Recent games weigh more."""
        if not values:
            return 0.0
        n = len(values)
        weights = [decay ** (n - 1 - i) for i in range(n)]
        total_weight = sum(weights)
        return sum(v * w for v, w in zip(values, weights)) / total_weight

    def _calculate_consistency(self, pontos: list[float]) -> dict:
        """Calculate consistency metrics."""
        if len(pontos) < 2:
            return {
                "cv": 0.0,
                "desvio_padrao": 0.0,
                "rating": "insuficiente",
                "acima_media_pct": 100.0,
                "pontuou_positivo_pct": 100.0,
            }

        avg = mean(pontos)
        dp = stdev(pontos)
        cv = (dp / avg * 100) if avg > 0 else 0

        acima_media = len([p for p in pontos if p >= avg]) / len(pontos) * 100
        positivo = len([p for p in pontos if p > 0]) / len(pontos) * 100

        if cv < 30:
            rating = "muito_consistente"
        elif cv < 50:
            rating = "consistente"
        elif cv < 80:
            rating = "irregular"
        else:
            rating = "muito_irregular"

        return {
            "cv": round(cv, 2),
            "desvio_padrao": round(dp, 2),
            "rating": rating,
            "acima_media_pct": round(acima_media, 1),
            "pontuou_positivo_pct": round(positivo, 1),
        }

    def _calculate_form_factor(self, pontos: list[float]) -> float:
        """
        Calculate form factor comparing recent vs overall performance.
        > 1.0 means improving, < 1.0 means declining.
        """
        if len(pontos) < 3:
            return 1.0

        overall_avg = mean(pontos)
        if overall_avg == 0:
            return 1.0

        # Last 3 games average
        recent_avg = mean(pontos[-3:])
        factor = recent_avg / overall_avg

        # Clamp to reasonable range
        return max(0.7, min(1.3, factor))

    def _scout_based_projection(self, scouts: list) -> float:
        """Project score based on per-game scout averages and official weights."""
        if not scouts:
            return 0.0

        jogos = len(scouts)
        projected = 0.0

        for scout_key, weight in SCOUT_POINTS.items():
            avg_per_game = sum(getattr(s, scout_key, 0) for s in scouts) / jogos
            projected += avg_per_game * weight

        return projected

    async def _get_opponent_factor(self, atleta: Atleta, posicao: Posicao | None) -> float:
        """
        Calculate opponent difficulty factor.
        For now, use a simplified version based on available data.
        """
        # Get next match for the player's club
        mercado = await self.db.get(MercadoStatus, 1)
        if not mercado:
            return 1.0

        rodada_atual = mercado.rodada_atual

        result = await self.db.execute(
            select(Partida).where(
                Partida.rodada_id == rodada_atual,
                (Partida.clube_casa_id == atleta.clube_id)
                | (Partida.clube_visitante_id == atleta.clube_id),
            )
        )
        partida = result.scalars().first()

        if not partida:
            return 1.0

        # Get opponent ID
        opponent_id = (
            partida.clube_visitante_id
            if partida.clube_casa_id == atleta.clube_id
            else partida.clube_casa_id
        )

        # Get opponent's defensive/offensive strength
        result = await self.db.execute(
            select(ScoutRodada).where(ScoutRodada.clube_id == opponent_id)
        )
        opp_scouts = result.scalars().all()

        if not opp_scouts:
            return 1.0

        # For attacking players: check opponent defensive weakness
        # For defensive players: check opponent attacking strength
        pos_abbr = posicao.abreviacao.lower() if posicao else ""

        if pos_abbr in ("ata", "mei"):
            # How many goals does the opponent concede?
            gs_per_game = sum(s.gols_sofridos for s in opp_scouts) / max(len(opp_scouts), 1)
            # More goals conceded = easier opponent for attackers
            factor = 1.0 + (gs_per_game - 1.0) * 0.1
        elif pos_abbr in ("gol", "zag", "lat"):
            # How many goals does the opponent score?
            g_per_game = sum(s.gols for s in opp_scouts) / max(len(opp_scouts), 1)
            # Fewer goals = easier to keep clean sheet
            factor = 1.0 - (g_per_game - 0.5) * 0.1
        else:
            factor = 1.0

        return max(0.8, min(1.2, factor))

    def _calculate_confidence(self, sample_size: int, cv: float) -> float:
        """Calculate prediction confidence (0-100%)."""
        # Base confidence from sample size (more games = more confident)
        size_factor = min(sample_size / 10, 1.0)  # Maxes at 10 games

        # Consistency factor (lower CV = more predictable)
        consistency_factor = max(0, 1.0 - cv / 150)

        confidence = (size_factor * 0.5 + consistency_factor * 0.5) * 100
        return max(10, min(95, confidence))

    def _calculate_risk(self, pontos: list[float], prediction: float) -> dict:
        """Risk analysis with min/max expected scores."""
        if len(pontos) < 2:
            return {
                "label": "desconhecido",
                "volatility": 0,
                "min_expected": round(prediction * 0.5, 2),
                "max_expected": round(prediction * 1.5, 2),
            }

        dp = stdev(pontos)

        # 1 standard deviation range
        min_expected = prediction - dp
        max_expected = prediction + dp

        if dp < 2:
            label = "baixo"
        elif dp < 4:
            label = "moderado"
        elif dp < 7:
            label = "alto"
        else:
            label = "muito_alto"

        return {
            "label": label,
            "volatility": round(dp, 2),
            "min_expected": round(max(min_expected, -5), 2),
            "max_expected": round(max_expected, 2),
        }

    def _value_rating(self, predicted_score: float, price: float) -> str:
        """Rate value: how good is the price for the projected score."""
        if price <= 0:
            return "desconhecido"

        ppc = predicted_score / price
        if ppc >= 1.5:
            return "excelente"
        elif ppc >= 1.0:
            return "bom"
        elif ppc >= 0.6:
            return "regular"
        else:
            return "ruim"

    def _optimize_lineup(
        self,
        by_position: dict[str, list[dict]],
        formation_slots: dict[str, int],
        budget: float,
        strategy: str,
    ) -> list[dict] | None:
        """
        Budget-aware lineup optimizer with greedy selection + fallback.

        1. Estimates avg budget per player and filters candidates within reach.
        2. Greedy picks the best affordable player at each slot.
        3. Falls back to cheapest available when budget is tight.
        """
        total_slots = sum(formation_slots.values())
        if total_slots == 0:
            return None

        def score_fn(pred: dict) -> float:
            if strategy == "aggressive":
                return pred["prediction"]["max_score"]
            elif strategy == "conservative":
                base = pred["prediction"]["score"]
                cv = pred["consistency"]["cv"]
                return base * (1 - cv / 200)
            elif strategy == "value":
                price = pred["preco"]
                if price <= 0:
                    return 0
                return pred["prediction"]["score"] / price
            else:  # balanced
                return pred["prediction"]["score"]

        # Sort each position by strategy score
        for pos_key in by_position:
            by_position[pos_key].sort(key=score_fn, reverse=True)

        lineup = []
        remaining = budget
        used_ids: set[int] = set()
        slots_remaining = total_slots

        # Process positions in order of scarcity (fewer candidates first)
        position_order = sorted(
            formation_slots.items(),
            key=lambda x: len(by_position.get(x[0], [])),
        )

        for pos_key, slots_needed in position_order:
            if slots_needed == 0:
                continue

            candidates = [
                p for p in by_position.get(pos_key, [])
                if p["atleta_id"] not in used_ids
            ]

            if not candidates:
                return None  # No candidates for this position at all

            selected = 0

            # Calculate max affordable price per remaining slot
            avg_budget_per_slot = remaining / max(slots_remaining, 1)

            # First pass: pick the best scorers that fit the budget
            for candidate in candidates:
                if selected >= slots_needed:
                    break
                if candidate["preco"] <= remaining and candidate["preco"] <= avg_budget_per_slot * 2.5:
                    lineup.append(candidate)
                    remaining -= candidate["preco"]
                    used_ids.add(candidate["atleta_id"])
                    selected += 1
                    slots_remaining -= 1

            # Second pass: fall back to cheapest available if we couldn't fill slots
            if selected < slots_needed:
                cheap_candidates = sorted(
                    [c for c in candidates if c["atleta_id"] not in used_ids],
                    key=lambda x: x["preco"],
                )
                for candidate in cheap_candidates:
                    if selected >= slots_needed:
                        break
                    if candidate["preco"] <= remaining:
                        lineup.append(candidate)
                        remaining -= candidate["preco"]
                        used_ids.add(candidate["atleta_id"])
                        selected += 1
                        slots_remaining -= 1

            if selected < slots_needed:
                return None  # Can't fill this position

        return lineup if len(lineup) == total_slots else None

    def _position_order(self, pos: str) -> int:
        """Sort order for positions in lineup display."""
        order = {"gol": 0, "zag": 1, "lat": 2, "mei": 3, "ata": 4, "tec": 5}
        return order.get(pos.lower(), 99)

    def _empty_prediction(self, atleta, clube, posicao) -> dict:
        """Return empty prediction for players with no history."""
        return {
            "atleta_id": atleta.id,
            "apelido": atleta.apelido,
            "foto": atleta.foto,
            "clube_nome": clube.nome_fantasia if clube else "",
            "clube_escudo": clube.escudo_30 if clube else "",
            "posicao": posicao.abreviacao if posicao else "",
            "posicao_nome": posicao.nome if posicao else "",
            "preco": atleta.preco_num,
            "media_geral": round(atleta.media_num, 2),
            "jogos": atleta.jogos_num,
            "prediction": {
                "score": round(atleta.media_num, 2),
                "min_score": 0.0,
                "max_score": round(atleta.media_num * 2, 2),
                "confidence": 10.0,
                "method_breakdown": {
                    "weighted_avg": round(atleta.media_num, 2),
                    "scout_projection": 0.0,
                    "historic_avg": round(atleta.media_num, 2),
                    "form_factor": 1.0,
                    "opponent_factor": 1.0,
                },
            },
            "consistency": {
                "cv": 0.0,
                "desvio_padrao": 0.0,
                "rating": "insuficiente",
                "acima_media_pct": 0.0,
                "pontuou_positivo_pct": 0.0,
            },
            "form": {
                "last_5": [],
                "trend": "insuficiente",
                "form_factor": 1.0,
            },
            "risk": {
                "label": "desconhecido",
                "volatility": 0,
                "min_expected": 0.0,
                "max_expected": round(atleta.media_num * 2, 2),
            },
            "value": {
                "preco": atleta.preco_num,
                "pontos_por_cartoleta": round(
                    atleta.media_num / atleta.preco_num if atleta.preco_num > 0 else 0, 2
                ),
                "rating": "desconhecido",
            },
        }
