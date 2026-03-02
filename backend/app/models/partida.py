from sqlalchemy import String, Integer, ForeignKey, DateTime, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database import Base


class Partida(Base):
    __tablename__ = "partidas"
    __table_args__ = (
        Index("ix_partidas_rodada_id", "rodada_id"),
        Index("ix_partidas_clube_casa_id", "clube_casa_id"),
        Index("ix_partidas_clube_visitante_id", "clube_visitante_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rodada_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rodadas.id"), nullable=False
    )
    clube_casa_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clubes.id"), nullable=False
    )
    clube_visitante_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clubes.id"), nullable=False
    )
    clube_casa_posicao: Mapped[int | None] = mapped_column(Integer, nullable=True)
    clube_visitante_posicao: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    placar_oficial_mandante: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    placar_oficial_visitante: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    local: Mapped[str | None] = mapped_column(String(200), nullable=True)
    partida_data: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    valida: Mapped[bool] = mapped_column(default=False)
    aproveitamento_mandante: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    aproveitamento_visitante: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    rodada: Mapped["Rodada"] = relationship("Rodada", lazy="joined")
    clube_casa: Mapped["Clube"] = relationship(
        "Clube",
        foreign_keys=[clube_casa_id],
        back_populates="partidas_mandante",
    )
    clube_visitante: Mapped["Clube"] = relationship(
        "Clube",
        foreign_keys=[clube_visitante_id],
        back_populates="partidas_visitante",
    )

    def __repr__(self) -> str:
        return f"<Partida {self.id}: {self.clube_casa_id} x {self.clube_visitante_id}>"
