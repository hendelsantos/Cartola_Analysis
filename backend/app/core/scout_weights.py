"""
Official Cartola FC scout point weights — single source of truth.

All services (PredictionService, MoneyballService, TipsService) should
import weights from here to ensure consistency.
"""

# Official Cartola FC scoring weights
SCOUT_WEIGHTS: dict[str, float] = {
    "gols": 8.0,
    "assistencias": 5.0,
    "finalizacao_trave": 3.0,
    "finalizacao_defendida": 1.2,
    "finalizacao_fora": 0.8,
    "faltas_sofridas": 0.5,
    "faltas_cometidas": -0.5,
    "cartao_amarelo": -2.0,
    "cartao_vermelho": -5.0,
    "impedimentos": -0.5,
    "desarmes": 1.5,
    "defesas": 3.0,
    "gols_sofridos": -2.0,
    "saldo_gol": 5.0,
    "defesa_penalti": 7.0,
    "gol_contra": -5.0,
    "penalti_cometido": -4.0,
    "penalti_sofrido": 1.0,
    "vitoria": 1.0,
    "passes_errados": -0.3,
}

# Human-readable labels for scout stats
SCOUT_LABELS: dict[str, str] = {
    "gols": "Gols",
    "assistencias": "Assistências",
    "finalizacao_trave": "Fin. Trave",
    "finalizacao_defendida": "Fin. Defendida",
    "finalizacao_fora": "Fin. Fora",
    "faltas_sofridas": "Faltas Sofridas",
    "desarmes": "Desarmes",
    "defesas": "Defesas",
    "saldo_gol": "Saldo de Gol",
    "defesa_penalti": "Def. Pênalti",
    "vitoria": "Vitória",
    "passes_errados": "Passes Errados",
    "impedimentos": "Impedimentos",
    "faltas_cometidas": "Faltas Cometidas",
    "cartao_amarelo": "Cartão Amarelo",
    "cartao_vermelho": "Cartão Vermelho",
    "gol_contra": "Gol Contra",
    "gols_sofridos": "Gols Sofridos",
    "penalti_cometido": "Pênalti Cometido",
    "penalti_sofrido": "Pênalti Sofrido",
}

# Only use scouts that have non-zero weights
ACTIVE_SCOUTS: list[str] = [k for k in SCOUT_WEIGHTS if SCOUT_WEIGHTS[k] != 0]
