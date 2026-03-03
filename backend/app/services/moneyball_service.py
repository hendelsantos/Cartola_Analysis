"""
Moneyball Analytics Service
============================
Inspired by the Moneyball philosophy: find value where the market overlooks.
Uses statistical analysis of underlying scout data to identify market
inefficiencies in Cartola FC fantasy football.

Key concepts:
- xPts (Expected Points): Points predicted from scout production rates
- Alpha: Value ratio (xPts / price) — higher = more undervalued
- Regression: Gap between xPts vs actual (buy signal when positive)
- Momentum: Recent form trends (hot/cold streaks)
- Consistency: Reliability score (low variance = dependable)
- Scout DNA: Which scouts truly correlate with high scores per position
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from collections import defaultdict
import math

from app.models.atleta import Atleta
from app.models.clube import Clube
from app.models.posicao import Posicao
from app.models.scout import ScoutRodada
from app.core.scout_weights import SCOUT_WEIGHTS, SCOUT_LABELS, ACTIVE_SCOUTS


class MoneyballService:
    """Core analytics engine implementing Moneyball principles for Cartola FC."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _load_player_analytics(self, min_jogos: int = 3):
        """Load all players with their per-round scout data and compute analytics.

        This is the foundation query — all analysis methods build on this data.
        """
        # Get all players with relationships
        stmt = (
            select(Atleta)
            .options(selectinload(Atleta.clube), selectinload(Atleta.posicao))
            .where(Atleta.jogos_num >= min_jogos)
        )
        result = await self.db.execute(stmt)
        players = result.scalars().unique().all()

        if not players:
            return []

        player_ids = [p.id for p in players]

        # Get all scout data
        scout_stmt = (
            select(ScoutRodada)
            .where(ScoutRodada.atleta_id.in_(player_ids))
            .where(ScoutRodada.entrou_em_campo == True)
            .order_by(ScoutRodada.rodada_id)
        )
        scout_result = await self.db.execute(scout_stmt)
        all_scouts = scout_result.scalars().all()

        # Group scouts by player
        scouts_by_player: dict[int, list[ScoutRodada]] = defaultdict(list)
        for s in all_scouts:
            scouts_by_player[s.atleta_id].append(s)

        # Build enriched player analytics
        enriched = []
        for p in players:
            scouts = scouts_by_player.get(p.id, [])
            n = len(scouts)
            if n < min_jogos:
                continue

            # Calculate scout averages
            scout_avgs: dict[str, float] = {}
            for field in ACTIVE_SCOUTS:
                vals = [getattr(s, field, 0) or 0 for s in scouts]
                scout_avgs[field] = sum(vals) / n

            # Calculate xPts (expected points from scout production)
            xpts = sum(scout_avgs.get(k, 0) * w for k, w in SCOUT_WEIGHTS.items() if k in scout_avgs)

            # Points history
            points_history = [s.pontos_num or 0 for s in scouts]
            avg_pts = sum(points_history) / n

            # Standard deviation
            variance = sum((x - avg_pts) ** 2 for x in points_history) / n
            std_dev = math.sqrt(variance) if variance > 0 else 0

            # Consistency (inverted coefficient of variation, scaled 0-100)
            cv = std_dev / abs(avg_pts) if avg_pts != 0 else 999
            consistency = max(0, min(100, round((1 - min(cv, 2)) * 50 + 50)))

            # Momentum (last 3 vs overall average)
            last_3 = points_history[-3:] if n >= 3 else points_history
            last_5 = points_history[-5:] if n >= 5 else points_history
            avg_last_3 = sum(last_3) / len(last_3) if last_3 else 0
            avg_last_5 = sum(last_5) / len(last_5) if last_5 else 0
            momentum = round((avg_last_3 / avg_pts - 1) * 100, 1) if avg_pts > 0.5 else 0

            # Trend direction
            if n >= 3:
                first_half = points_history[:n // 2]
                second_half = points_history[n // 2:]
                avg_first = sum(first_half) / len(first_half) if first_half else 0
                avg_second = sum(second_half) / len(second_half) if second_half else 0
                trend_pct = ((avg_second - avg_first) / abs(avg_first) * 100) if avg_first != 0 else 0
            else:
                trend_pct = 0

            # Price and value metrics
            price = p.preco_num or 0.01
            alpha = round(xpts / price, 3) if price > 0 else 0
            value_score = round(avg_pts / price, 3) if price > 0 else 0

            # Positive score percentage
            pos_pct = round(sum(1 for x in points_history if x > 0) / n * 100, 1)

            # Floor / ceiling (10th and 90th percentile)
            sorted_pts = sorted(points_history)
            idx_10 = max(0, int(n * 0.1))
            idx_90 = min(n - 1, int(n * 0.9))
            floor_val = sorted_pts[idx_10]
            ceiling_val = sorted_pts[idx_90]

            # Regression score: how far actual avg is from xPts (in std devs)
            # Positive = underperforming (buy signal), Negative = overperforming (sell signal)
            regression = round((xpts - avg_pts) / std_dev, 2) if std_dev > 0.1 else 0

            # Sharpe-like ratio (risk-adjusted return)
            sharpe = round(avg_pts / std_dev, 2) if std_dev > 0.1 else 0

            # Victory correlation
            victories = [getattr(s, "vitoria", 0) or 0 for s in scouts]
            vic_pct = round(sum(1 for v in victories if v > 0) / n * 100, 1) if n > 0 else 0

            pos_abbrev = p.posicao.abreviacao if p.posicao else "?"
            pos_nome = p.posicao.nome if p.posicao else "?"

            enriched.append({
                "atleta_id": p.id,
                "apelido": p.apelido,
                "nome": p.nome,
                "foto": p.foto,
                "clube_nome": p.clube.nome_fantasia if p.clube else "?",
                "clube_abreviacao": p.clube.abreviacao if p.clube else "?",
                "posicao": pos_abbrev,
                "posicao_nome": pos_nome,
                "preco": price,
                "media": round(avg_pts, 2),
                "jogos": n,
                "xpts": round(xpts, 2),
                "alpha": alpha,
                "value_score": value_score,
                "std_dev": round(std_dev, 2),
                "consistency": consistency,
                "momentum": momentum,
                "trend_pct": round(trend_pct, 1),
                "avg_last_3": round(avg_last_3, 2),
                "avg_last_5": round(avg_last_5, 2),
                "pos_pct": pos_pct,
                "floor": round(floor_val, 2),
                "ceiling": round(ceiling_val, 2),
                "regression": regression,
                "sharpe": sharpe,
                "vic_pct": vic_pct,
                "variacao": p.variacao_num or 0,
                "points_history": [round(x, 2) for x in points_history[-10:]],
                "scout_avgs": {k: round(v, 3) for k, v in scout_avgs.items()},
            })

        return enriched

    async def get_full_analysis(self, min_jogos: int = 3):
        """Complete Moneyball analysis — all players with all metrics.

        The frontend loads this once and filters/sorts client-side for instant tabs.
        """
        players = await self._load_player_analytics(min_jogos)

        if not players:
            return {"players": [], "summary": {}, "position_avg_alpha": {}}

        # Position averages
        pos_groups: dict[str, list] = defaultdict(list)
        for p in players:
            pos_groups[p["posicao"]].append(p)

        pos_avg_alpha = {}
        for pos, group in pos_groups.items():
            alphas = [p["alpha"] for p in group]
            pos_avg_alpha[pos] = round(sum(alphas) / len(alphas), 3) if alphas else 0

        # Enrich with relative alpha
        for p in players:
            avg_alpha = pos_avg_alpha.get(p["posicao"], 0)
            p["alpha_vs_pos"] = round(p["alpha"] - avg_alpha, 3)
            p["is_undervalued"] = p["alpha"] > avg_alpha * 1.2

        # Sort by alpha for the default view
        players.sort(key=lambda x: x["alpha"], reverse=True)

        # Summary stats
        by_alpha = players
        gems = sorted([p for p in players if p["preco"] <= 12], key=lambda x: x["xpts"], reverse=True)
        by_momentum = sorted(players, key=lambda x: x["momentum"], reverse=True)
        by_consistency = sorted([p for p in players if p["media"] > 0], key=lambda x: x["consistency"], reverse=True)
        by_regression = sorted(players, key=lambda x: x["regression"], reverse=True)
        by_sharpe = sorted([p for p in players if p["sharpe"] > 0], key=lambda x: x["sharpe"], reverse=True)

        avg_alpha = sum(p["alpha"] for p in players) / len(players)
        undervalued_count = sum(1 for p in players if p.get("is_undervalued"))

        def summarize(p):
            if not p:
                return None
            return {k: p[k] for k in ["atleta_id", "apelido", "clube_nome", "posicao", "preco", "media", "xpts", "alpha", "momentum", "consistency", "regression", "sharpe"]}

        summary = {
            "total_players": len(players),
            "avg_alpha": round(avg_alpha, 3),
            "undervalued_count": undervalued_count,
            "gems_count": len(gems),
            "top_alpha": summarize(by_alpha[0]) if by_alpha else None,
            "top_gem": summarize(gems[0]) if gems else None,
            "top_momentum": summarize(by_momentum[0]) if by_momentum else None,
            "most_consistent": summarize(by_consistency[0]) if by_consistency else None,
            "biggest_buy_signal": summarize(by_regression[0]) if by_regression else None,
            "best_sharpe": summarize(by_sharpe[0]) if by_sharpe else None,
        }

        return {
            "players": players,
            "summary": summary,
            "position_avg_alpha": pos_avg_alpha,
        }

    async def get_scout_correlations(self):
        """Calculate which scouts correlate most with high scores per position.

        This reveals market inefficiencies — what stats actually matter
        versus what the market pays for.
        """
        stmt = (
            select(ScoutRodada)
            .where(ScoutRodada.entrou_em_campo == True)
        )
        result = await self.db.execute(stmt)
        all_scouts = result.scalars().all()

        # Group by position
        pos_data: dict[int, dict[str, list]] = defaultdict(
            lambda: {"pontos": [], **{k: [] for k in ACTIVE_SCOUTS}}
        )

        for s in all_scouts:
            pos_key = s.posicao_id
            pos_data[pos_key]["pontos"].append(s.pontos_num or 0)
            for field in ACTIVE_SCOUTS:
                pos_data[pos_key][field].append(getattr(s, field, 0) or 0)

        # Calculate correlations per position
        pos_map = {1: "GOL", 2: "LAT", 3: "ZAG", 4: "MEI", 5: "ATA", 6: "TEC"}
        pos_names = {1: "Goleiro", 2: "Lateral", 3: "Zagueiro", 4: "Meia", 5: "Atacante", 6: "Técnico"}

        correlations = {}
        for pos_id, data in pos_data.items():
            if len(data["pontos"]) < 20:
                continue
            abbrev = pos_map.get(pos_id, f"P{pos_id}")
            scouts = {}
            for field in ACTIVE_SCOUTS:
                r = self._pearson(data[field], data["pontos"])
                scouts[field] = {
                    "correlation": round(r, 4),
                    "label": SCOUT_LABELS.get(field, field),
                    "weight": SCOUT_WEIGHTS.get(field, 0),
                    "impact": round(abs(r) * abs(SCOUT_WEIGHTS.get(field, 0)), 4),
                    "avg": round(sum(data[field]) / len(data[field]), 3),
                    "is_positive": SCOUT_WEIGHTS.get(field, 0) > 0,
                }
            # Sort by absolute correlation
            scouts = dict(sorted(scouts.items(), key=lambda x: abs(x[1]["correlation"]), reverse=True))
            correlations[abbrev] = {
                "posicao_nome": pos_names.get(pos_id, "?"),
                "sample_size": len(data["pontos"]),
                "scouts": scouts,
            }

        return correlations

    @staticmethod
    def _pearson(x: list, y: list) -> float:
        """Pearson correlation coefficient."""
        n = len(x)
        if n < 5:
            return 0.0
        mean_x = sum(x) / n
        mean_y = sum(y) / n
        cov = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
        std_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x))
        std_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y))
        if std_x < 1e-10 or std_y < 1e-10:
            return 0.0
        return cov / (std_x * std_y)
