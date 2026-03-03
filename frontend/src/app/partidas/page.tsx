"use client";

import { useEffect, useState } from "react";
import { getPartidas, getRodadas, type Partida, type Rodada } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Calendar, MapPin } from "lucide-react";

export default function PartidasPage() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getRodadas()
      .then((r) => setRodadas(r.rodadas))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getPartidas(rodadaSelecionada)
      .then((r) => setPartidas(r.partidas))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [rodadaSelecionada]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partidas</h1>
        <p className="text-sm text-muted-foreground">
          Jogos do Brasileirão Série A
        </p>
      </div>

      {/* Rodada selector */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <select
          value={rodadaSelecionada || ""}
          onChange={(e) =>
            setRodadaSelecionada(
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Todas as rodadas</option>
          {rodadas.map((r) => (
            <option key={r.id} value={r.id}>
              Rodada {r.id}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorAlert />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {partidas.map((p) => {
            const temPlacar =
              p.placar_oficial_mandante !== null &&
              p.placar_oficial_visitante !== null;
            return (
              <Card key={p.id} className="relative">
                <div className="flex items-center justify-between">
                  {/* Mandante */}
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-card-foreground">
                      {p.clube_casa_nome || `Clube ${p.clube_casa_id}`}
                    </p>
                    {p.clube_casa_posicao && (
                      <p className="text-xs text-muted-foreground">
                        {p.clube_casa_posicao}º
                      </p>
                    )}
                    {p.aproveitamento_mandante && (
                      <div className="mt-1 flex justify-end gap-0.5">
                        {p.aproveitamento_mandante.map((r, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              r === "v"
                                ? "bg-success"
                                : r === "d"
                                  ? "bg-danger"
                                  : "bg-warning"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Placar */}
                  <div className="mx-6 text-center">
                    {temPlacar ? (
                      <p className="text-2xl font-bold text-foreground">
                        {p.placar_oficial_mandante} x{" "}
                        {p.placar_oficial_visitante}
                      </p>
                    ) : (
                      <p className="text-lg font-medium text-muted-foreground">
                        vs
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(p.partida_data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Visitante */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-card-foreground">
                      {p.clube_visitante_nome || `Clube ${p.clube_visitante_id}`}
                    </p>
                    {p.clube_visitante_posicao && (
                      <p className="text-xs text-muted-foreground">
                        {p.clube_visitante_posicao}º
                      </p>
                    )}
                    {p.aproveitamento_visitante && (
                      <div className="mt-1 flex gap-0.5">
                        {p.aproveitamento_visitante.map((r, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              r === "v"
                                ? "bg-success"
                                : r === "d"
                                  ? "bg-danger"
                                  : "bg-warning"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {p.local && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {p.local}
                  </div>
                )}

                {!p.valida && (
                  <Badge variant="warning" className="absolute right-4 top-4">
                    Adiada
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
