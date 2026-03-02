from sqlalchemy import Integer, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.database import Base


class MercadoStatus(Base):
    __tablename__ = "mercado_status"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rodada_atual: Mapped[int] = mapped_column(Integer, nullable=False)
    status_mercado: Mapped[int] = mapped_column(Integer, nullable=False)
    temporada: Mapped[int] = mapped_column(Integer, nullable=False)
    game_over: Mapped[bool] = mapped_column(Boolean, default=False)
    times_escalados: Mapped[int] = mapped_column(Integer, default=0)
    fechamento_timestamp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    @property
    def status_label(self) -> str:
        status_map = {
            1: "Mercado Aberto",
            2: "Mercado Fechado",
            3: "Mercado em Manutenção",
            4: "Fim de Temporada",
            6: "Em Rodada",
        }
        return status_map.get(self.status_mercado, "Desconhecido")

    def __repr__(self) -> str:
        return f"<MercadoStatus rodada={self.rodada_atual} status={self.status_label}>"
