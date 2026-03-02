from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.mercado import MercadoStatus
from app.schemas.mercado import MercadoStatusResponse
from app.services.cartola_api import cartola_client

router = APIRouter()


@router.get("/status", response_model=MercadoStatusResponse)
async def get_mercado_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MercadoStatus).where(MercadoStatus.id == 1))
    status = result.scalar_one_or_none()

    if not status:
        # Fallback: fetch live from API
        data = await cartola_client.get_mercado_status()
        status_map = {
            1: "Mercado Aberto",
            2: "Mercado Fechado",
            3: "Mercado em Manutenção",
            4: "Fim de Temporada",
            6: "Em Rodada",
        }
        return MercadoStatusResponse(
            rodada_atual=data["rodada_atual"],
            status_mercado=data["status_mercado"],
            status_label=status_map.get(data["status_mercado"], "Desconhecido"),
            temporada=data["temporada"],
            game_over=data.get("game_over", False),
            times_escalados=data.get("times_escalados", 0),
            fechamento_timestamp=data.get("fechamento", {}).get("timestamp"),
        )

    return MercadoStatusResponse(
        rodada_atual=status.rodada_atual,
        status_mercado=status.status_mercado,
        status_label=status.status_label,
        temporada=status.temporada,
        game_over=status.game_over,
        times_escalados=status.times_escalados,
        fechamento_timestamp=status.fechamento_timestamp,
        atualizado_em=status.atualizado_em,
    )


@router.get("/destaques")
async def get_mercado_destaques():
    """Proxy destaques from Cartola API."""
    try:
        return await cartola_client.get_mercado_destaques()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
