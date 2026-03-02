from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Clube(Base):
    __tablename__ = "clubes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(10), nullable=False)
    abreviacao: Mapped[str] = mapped_column(String(10), nullable=False)
    slug: Mapped[str | None] = mapped_column(String(100), nullable=True)
    apelido: Mapped[str | None] = mapped_column(String(100), nullable=True)
    nome_fantasia: Mapped[str] = mapped_column(String(100), nullable=False)
    escudo_60: Mapped[str | None] = mapped_column(String(500), nullable=True)
    escudo_45: Mapped[str | None] = mapped_column(String(500), nullable=True)
    escudo_30: Mapped[str | None] = mapped_column(String(500), nullable=True)
    url_editoria: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    atletas: Mapped[list["Atleta"]] = relationship(
        "Atleta", back_populates="clube", lazy="selectin"
    )
    partidas_mandante: Mapped[list["Partida"]] = relationship(
        "Partida",
        foreign_keys="Partida.clube_casa_id",
        back_populates="clube_casa",
        lazy="selectin",
    )
    partidas_visitante: Mapped[list["Partida"]] = relationship(
        "Partida",
        foreign_keys="Partida.clube_visitante_id",
        back_populates="clube_visitante",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Clube {self.nome_fantasia} ({self.abreviacao})>"
