"""
Dicas da Rodada — Round Tips Service
======================================
The "play caller" — combines Moneyball analytics with prediction elements
to generate actionable round-by-round recommendations.

Key outputs:
- Captain & Vice recommendation (optimal 2x candidate)
- Top picks per position (sorted by combined score)
- Moonshots (high ceiling + buy signal)
- Avoid list (overperformers + cold streaks)
- Budget-tier picks (barato, médio, premium)
- Quick lineup suggestion
"""

from sqlalchemy.ext.asyncio import AsyncSession
from collections import defaultdict

from app.services.moneyball_service import MoneyballService


# Optimal captain scoring formula:
# We want the player with the highest EXPECTED DOUBLE VALUE.
# Balance: production strength, recent form, upside, and reliability.
def _captain_score(p: dict) -> float:
    """Score a player as potential captain (2x points)."""
    xpts = p.get("xpts", 0)
    last3 = p.get("avg_last_3", 0)
    media = p.get("media", 0)
    ceiling = p.get("ceiling", 0)
    consistency = p.get("consistency", 0)
    momentum = p.get("momentum", 0)
    pos_pct = p.get("pos_pct", 0)

    # Base expected value components
    production = xpts * 0.30 + last3 * 0.25 + media * 0.15

    # Upside (captain doubles, so ceiling matters more)
    upside = ceiling * 0.10

    # Safety (captain scoring 0 is a disaster)
    safety = (consistency / 100) * media * 0.10 + (pos_pct / 100) * 0.10

    # Momentum bonus
    mom_bonus = max(0, momentum) * 0.02

    return production + upside + safety + mom_bonus


# Combined "pick quality" score for position recommendations
def _pick_score(p: dict) -> float:
    """Overall pick quality score blending all factors."""
    xpts = p.get("xpts", 0)
    last3 = p.get("avg_last_3", 0)
    media = p.get("media", 0)
    alpha = p.get("alpha", 0)
    consistency = p.get("consistency", 0)
    momentum = p.get("momentum", 0)
    sharpe = p.get("sharpe", 0)

    return (
        xpts * 0.30
        + last3 * 0.25
        + media * 0.15
        + sharpe * 0.10
        + (consistency / 100) * 0.10
        + max(0, momentum) * 0.02
        + alpha * 0.08
    )


# Moonshot score: players with high ceiling and buy signals
def _moonshot_score(p: dict) -> float:
    """Score for moonshot candidates — explosive upside + undervaluation."""
    ceiling = p.get("ceiling", 0)
    regression = p.get("regression", 0)
    momentum = p.get("momentum", 0)
    alpha = p.get("alpha", 0)

    return (
        ceiling * 0.35
        + max(0, regression) * 2.0  # Positive regression = likely to score more
        + max(0, momentum) * 0.03
        + alpha * 0.15
    )


# Avoid score: negative signals compound
def _avoid_score(p: dict) -> float:
    """Score for players to avoid — higher = worse outlook."""
    regression = p.get("regression", 0)
    momentum = p.get("momentum", 0)
    consistency = p.get("consistency", 0)
    alpha = p.get("alpha", 0)

    return (
        min(0, regression) * -2.0  # Negative regression = overperforming
        + min(0, momentum) * -0.05
        + max(0, 50 - consistency) * 0.02  # Low consistency
        + max(0, 1 - alpha) * 0.5  # Low alpha (overpriced)
    )


class TipsService:
    """Generates actionable round-by-round tips for Cartola FC."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.moneyball = MoneyballService(db)

    async def get_round_tips(self, budget: float = 140.0, formation: str = "4-4-2"):
        """Generate comprehensive round tips."""
        # Load all player analytics from Moneyball engine
        mb = await self.moneyball.get_full_analysis(min_jogos=3)
        players = mb.get("players", [])

        if not players:
            return {"error": "Sem dados suficientes para gerar dicas"}

        # ── 1. Captain & Vice ────────────────────────────
        # Only consider players with good sample size and positive media
        captain_candidates = [
            p for p in players
            if p["jogos"] >= 5 and p["media"] > 2 and p["consistency"] >= 30
        ]

        # Score and rank
        for p in captain_candidates:
            p["_captain_score"] = _captain_score(p)

        captain_candidates.sort(key=lambda x: x["_captain_score"], reverse=True)
        capitao = self._format_tip_player(captain_candidates[0], "capitao") if captain_candidates else None
        vice = self._format_tip_player(captain_candidates[1], "vice") if len(captain_candidates) > 1 else None

        # Captain reasoning
        if capitao:
            p = captain_candidates[0]
            reasons = []
            if p["avg_last_3"] > p["media"] * 1.1:
                reasons.append("Em boa fase recente")
            if p["consistency"] >= 60:
                reasons.append("Alta consistência")
            if p["regression"] > 0.3:
                reasons.append("Tendência de alta (regressão)")
            if p["ceiling"] > p["media"] * 1.5:
                reasons.append("Alto teto de pontuação")
            if p["momentum"] > 15:
                reasons.append("Forte momentum")
            capitao["razoes"] = reasons or ["Melhor combinação de produção e confiabilidade"]

        # ── 2. Top picks per position ────────────────────
        pos_groups: dict[str, list] = defaultdict(list)
        for p in players:
            if p["media"] > 0:
                p["_pick_score"] = _pick_score(p)
                pos_groups[p["posicao"]].append(p)

        picks = {}
        pos_limits = {"GOL": 3, "LAT": 4, "ZAG": 4, "MEI": 5, "ATA": 4, "TEC": 3}
        for pos, group in pos_groups.items():
            group.sort(key=lambda x: x.get("_pick_score", 0), reverse=True)
            limit = pos_limits.get(pos, 3)
            picks[pos] = [self._format_tip_player(p, "pick") for p in group[:limit]]

        # ── 3. Moonshots ─────────────────────────────────
        moonshot_candidates = [
            p for p in players
            if p["media"] > 0 and p["ceiling"] > 5 and p["regression"] > 0
        ]
        for p in moonshot_candidates:
            p["_moonshot_score"] = _moonshot_score(p)
        moonshot_candidates.sort(key=lambda x: x["_moonshot_score"], reverse=True)
        moonshots = [self._format_tip_player(p, "moonshot") for p in moonshot_candidates[:8]]

        # ── 4. Avoid list ────────────────────────────────
        avoid_candidates = [
            p for p in players
            if p["regression"] < -0.3 or (p["momentum"] < -20 and p["preco"] > 8)
        ]
        for p in avoid_candidates:
            p["_avoid_score"] = _avoid_score(p)
        avoid_candidates.sort(key=lambda x: x["_avoid_score"], reverse=True)
        evitar = []
        for p in avoid_candidates[:8]:
            tip = self._format_tip_player(p, "evitar")
            reasons = []
            if p["regression"] < -0.5:
                reasons.append("Overperforming — regressão provável")
            if p["momentum"] < -20:
                reasons.append(f"Momentum negativo ({p['momentum']:.0f}%)")
            if p["consistency"] < 30:
                reasons.append("Muito inconsistente")
            if p["alpha"] < 0.5 and p["preco"] > 10:
                reasons.append("Caro para o que produz")
            tip["razoes"] = reasons
            evitar.append(tip)

        # ── 5. Budget tiers ──────────────────────────────
        sorted_by_pick = sorted(
            [p for p in players if p["media"] > 0],
            key=lambda x: x.get("_pick_score", 0), reverse=True
        )

        baratos = [
            self._format_tip_player(p, "barato")
            for p in sorted_by_pick if p["preco"] <= 8
        ][:6]

        medio = [
            self._format_tip_player(p, "medio")
            for p in sorted_by_pick if 8 < p["preco"] <= 16
        ][:6]

        premium = [
            self._format_tip_player(p, "premium")
            for p in sorted_by_pick if p["preco"] > 16
        ][:6]

        # ── 6. Quick lineup suggestion ───────────────────
        escalacao = self._build_quick_lineup(players, budget, formation)

        # ── 7. Summary ───────────────────────────────────
        resumo = {
            "total_analisados": len(players),
            "jogadores_com_momentum_positivo": sum(1 for p in players if p["momentum"] > 10),
            "jogadores_subvalorizados": sum(1 for p in players if p.get("is_undervalued")),
            "moonshots_disponiveis": len(moonshot_candidates),
            "alertas_evitar": len(avoid_candidates),
        }

        return {
            "capitao": capitao,
            "vice_capitao": vice,
            "picks": picks,
            "moonshots": moonshots,
            "evitar": evitar,
            "tiers": {
                "baratos": baratos,
                "medio": medio,
                "premium": premium,
            },
            "escalacao": escalacao,
            "resumo": resumo,
        }

    def _format_tip_player(self, p: dict, tip_type: str) -> dict:
        """Format a player dict for tips output."""
        return {
            "atleta_id": p["atleta_id"],
            "apelido": p["apelido"],
            "nome": p.get("nome", ""),
            "foto": p.get("foto"),
            "clube_nome": p["clube_nome"],
            "clube_abreviacao": p["clube_abreviacao"],
            "posicao": p["posicao"],
            "posicao_nome": p.get("posicao_nome", ""),
            "preco": p["preco"],
            "media": p["media"],
            "xpts": p["xpts"],
            "alpha": p["alpha"],
            "consistency": p["consistency"],
            "momentum": p["momentum"],
            "avg_last_3": p["avg_last_3"],
            "floor": p["floor"],
            "ceiling": p["ceiling"],
            "regression": p["regression"],
            "sharpe": p["sharpe"],
            "variacao": p.get("variacao", 0),
            "points_history": p.get("points_history", []),
            "jogos": p["jogos"],
            "tip_type": tip_type,
        }

    def _build_quick_lineup(
        self, players: list[dict], budget: float, formation: str
    ) -> dict:
        """Greedy lineup builder using moneyball metrics."""
        FORMATIONS = {
            "3-4-3": {"GOL": 1, "ZAG": 3, "LAT": 0, "MEI": 4, "ATA": 3},
            "3-5-2": {"GOL": 1, "ZAG": 3, "LAT": 0, "MEI": 5, "ATA": 2},
            "4-3-3": {"GOL": 1, "ZAG": 2, "LAT": 2, "MEI": 3, "ATA": 3},
            "4-4-2": {"GOL": 1, "ZAG": 2, "LAT": 2, "MEI": 4, "ATA": 2},
            "4-5-1": {"GOL": 1, "ZAG": 2, "LAT": 2, "MEI": 5, "ATA": 1},
            "5-3-2": {"GOL": 1, "ZAG": 3, "LAT": 2, "MEI": 3, "ATA": 2},
            "5-4-1": {"GOL": 1, "ZAG": 3, "LAT": 2, "MEI": 4, "ATA": 1},
        }
        slots = FORMATIONS.get(formation, FORMATIONS["4-4-2"])

        # Group by position, sorted by pick score
        by_pos: dict[str, list[dict]] = defaultdict(list)
        for p in players:
            if p["media"] > 0:
                by_pos[p["posicao"]].append(p)
        for pos in by_pos:
            by_pos[pos].sort(key=lambda x: x.get("_pick_score", _pick_score(x)), reverse=True)

        lineup = []
        remaining = budget
        used = set()

        # Process scarce positions first
        pos_order = sorted(slots.items(), key=lambda x: len(by_pos.get(x[0], [])))

        for pos, count in pos_order:
            if count == 0:
                continue
            candidates = [p for p in by_pos.get(pos, []) if p["atleta_id"] not in used]
            selected = 0
            for c in candidates:
                if selected >= count:
                    break
                if c["preco"] <= remaining:
                    lineup.append(self._format_tip_player(c, "lineup"))
                    remaining -= c["preco"]
                    used.add(c["atleta_id"])
                    selected += 1
            # Fallback: cheapest available
            if selected < count:
                cheap = sorted(
                    [c for c in candidates if c["atleta_id"] not in used],
                    key=lambda x: x["preco"]
                )
                for c in cheap:
                    if selected >= count:
                        break
                    if c["preco"] <= remaining:
                        lineup.append(self._format_tip_player(c, "lineup"))
                        remaining -= c["preco"]
                        used.add(c["atleta_id"])
                        selected += 1

        total_price = sum(p["preco"] for p in lineup)
        total_xpts = sum(p["xpts"] for p in lineup)

        # Sort by position for display
        pos_order_map = {"GOL": 0, "ZAG": 1, "LAT": 2, "MEI": 3, "ATA": 4, "TEC": 5}
        lineup.sort(key=lambda x: pos_order_map.get(x["posicao"], 9))

        return {
            "formation": formation,
            "budget": budget,
            "total_price": round(total_price, 1),
            "remaining": round(budget - total_price, 1),
            "total_xpts": round(total_xpts, 1),
            "players": lineup,
            "count": len(lineup),
        }
