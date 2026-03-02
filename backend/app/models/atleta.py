from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Atleta(Base):
    __tablename__ = "atletas"
    __table_args__ = (
        Index("ix_atletas_clube_id", "clube_id"),
        Index("ix_atletas_posicao_id", "posicao_id"),
        Index("ix_atletas_status_id", "status_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str | None] = mapped_column(String(200), nullable=True)
    apelido: Mapped[str] = mapped_column(String(200), nullable=False)
    apelido_abreviado: Mapped[str | None] = mapped_column(String(100), nullable=True)
    nome: Mapped[str | None] = mapped_column(String(300), nullable=True)
    foto: Mapped[str | None] = mapped_column(String(500), nullable=True)
    clube_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clubes.id"), nullable=False
    )
    posicao_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("posicoes.id"), nullable=False
    )
    status_id: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pontos_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    media_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    preco_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    variacao_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    jogos_num: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    entrou_em_campo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    rodada_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    clube: Mapped["Clube"] = relationship("Clube", back_populates="atletas")
    posicao: Mapped["Posicao"] = relationship("Posicao", lazy="joined")
    scouts_rodada: Mapped[list["ScoutRodada"]] = relationship(
        "ScoutRodada", back_populates="atleta", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Atleta {self.apelido} (ID: {self.id})>"
