from sqlalchemy import Integer, Float, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ScoutRodada(Base):
    """Stores scout data per athlete per round for historical analysis."""

    __tablename__ = "scouts_rodada"
    __table_args__ = (
        UniqueConstraint("atleta_id", "rodada_id", name="uq_scout_atleta_rodada"),
        Index("ix_scouts_rodada_atleta_id", "atleta_id"),
        Index("ix_scouts_rodada_rodada_id", "rodada_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    atleta_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("atletas.id"), nullable=False
    )
    rodada_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rodadas.id"), nullable=False
    )
    clube_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clubes.id"), nullable=False
    )
    posicao_id: Mapped[int] = mapped_column(Integer, nullable=False)
    pontos_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    preco_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    variacao_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    media_num: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    entrou_em_campo: Mapped[bool] = mapped_column(default=False)

    # Scout fields — offensive
    gols: Mapped[int] = mapped_column(Integer, default=0, doc="G - Gols")
    assistencias: Mapped[int] = mapped_column(Integer, default=0, doc="A - Assistências")
    finalizacao_trave: Mapped[int] = mapped_column(Integer, default=0, doc="FT - Finalização na Trave")
    finalizacao_defendida: Mapped[int] = mapped_column(Integer, default=0, doc="FD - Finalização Defendida")
    finalizacao_fora: Mapped[int] = mapped_column(Integer, default=0, doc="FF - Finalização pra Fora")
    passes_errados: Mapped[int] = mapped_column(Integer, default=0, doc="PE - Passes Errados")

    # Scout fields — defensive
    faltas_sofridas: Mapped[int] = mapped_column(Integer, default=0, doc="FS - Faltas Sofridas")
    faltas_cometidas: Mapped[int] = mapped_column(Integer, default=0, doc="FC - Faltas Cometidas")
    cartao_amarelo: Mapped[int] = mapped_column(Integer, default=0, doc="CA - Cartão Amarelo")
    cartao_vermelho: Mapped[int] = mapped_column(Integer, default=0, doc="CV - Cartão Vermelho")
    impedimentos: Mapped[int] = mapped_column(Integer, default=0, doc="I - Impedimentos")
    desarmes: Mapped[int] = mapped_column(Integer, default=0, doc="DS - Desarmes")

    # Scout fields — goalkeeper
    defesas: Mapped[int] = mapped_column(Integer, default=0, doc="DE - Defesas")
    gols_sofridos: Mapped[int] = mapped_column(Integer, default=0, doc="GS - Gols Sofridos")
    saldo_gol: Mapped[int] = mapped_column(Integer, default=0, doc="SG - Jogo sem sofrer gol")
    defesa_penalti: Mapped[int] = mapped_column(Integer, default=0, doc="DP - Defesa de Pênalti")

    # Scout fields — other
    gol_contra: Mapped[int] = mapped_column(Integer, default=0, doc="GC - Gol Contra")
    penalti_cometido: Mapped[int] = mapped_column(Integer, default=0, doc="PC - Pênalti Cometido")
    penalti_sofrido: Mapped[int] = mapped_column(Integer, default=0, doc="PS - Pênalti Sofrido")
    vitoria: Mapped[int] = mapped_column(Integer, default=0, doc="V - Vitória do time")

    # Relationships
    atleta: Mapped["Atleta"] = relationship("Atleta", back_populates="scouts_rodada")
    rodada: Mapped["Rodada"] = relationship("Rodada", lazy="joined")

    def __repr__(self) -> str:
        return f"<ScoutRodada atleta={self.atleta_id} rodada={self.rodada_id}>"
