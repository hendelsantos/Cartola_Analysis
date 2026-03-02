"use client";

import { useEffect, useState, useCallback } from "react";
import { getAtletas, getClubes, type Atleta, type AtletaList, type Clube } from "@/lib/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import Link from "next/link";

const POSICOES = [
  { id: 1, nome: "Goleiro" },
  { id: 2, nome: "Lateral" },
  { id: 3, nome: "Zagueiro" },
  { id: 4, nome: "Meia" },
  { id: 5, nome: "Atacante" },
  { id: 6, nome: "Técnico" },
];

const STATUS_MAP: Record<number, { label: string; variant: "success" | "warning" | "danger" | "muted" }> = {
  2: { label: "Dúvida", variant: "warning" },
  3: { label: "Suspenso", variant: "danger" },
  5: { label: "Contundido", variant: "danger" },
  6: { label: "Nulo", variant: "muted" },
  7: { label: "Provável", variant: "success" },
};

export default function AtletasPage() {
  const [data, setData] = useState<AtletaList | null>(null);
  const [clubes, setClubes] = useState<Clube[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const [clubeId, setClubeId] = useState<number | undefined>();
  const [posicaoId, setPosicaoId] = useState<number | undefined>();
  const [ordem, setOrdem] = useState("media");
  const [direcao, setDirecao] = useState("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAtletas({
        page,
        per_page: 20,
        busca: busca || undefined,
        clube_id: clubeId,
        posicao_id: posicaoId,
        ordem,
        direcao,
      });
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, busca, clubeId, posicaoId, ordem, direcao]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getClubes()
      .then((r) => setClubes(r.clubes))
      .catch(console.error);
  }, []);

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const toggleSort = (field: string) => {
    if (ordem === field) {
      setDirecao(direcao === "desc" ? "asc" : "desc");
    } else {
      setOrdem(field);
      setDirecao("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Atletas</h1>
        <p className="text-sm text-muted-foreground">
          {data?.total || 0} atletas encontrados
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar atleta..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Clube */}
          <select
            value={clubeId || ""}
            onChange={(e) => {
              setClubeId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Todos os clubes</option>
            {clubes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_fantasia}
              </option>
            ))}
          </select>

          {/* Posição */}
          <select
            value={posicaoId || ""}
            onChange={(e) => {
              setPosicaoId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Todas as posições</option>
            {POSICOES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <TableSkeleton rows={10} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Atleta</th>
                    <th className="pb-3 font-medium">Clube</th>
                    <th className="pb-3 font-medium">Pos.</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th
                      className="cursor-pointer pb-3 font-medium"
                      onClick={() => toggleSort("media")}
                    >
                      <span className="flex items-center gap-1">
                        Média <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th
                      className="cursor-pointer pb-3 font-medium"
                      onClick={() => toggleSort("preco")}
                    >
                      <span className="flex items-center gap-1">
                        Preço <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th
                      className="cursor-pointer pb-3 font-medium"
                      onClick={() => toggleSort("pontos")}
                    >
                      <span className="flex items-center gap-1">
                        Pontos <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th
                      className="cursor-pointer pb-3 font-medium"
                      onClick={() => toggleSort("variacao")}
                    >
                      <span className="flex items-center gap-1">
                        Variação <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th
                      className="cursor-pointer pb-3 font-medium"
                      onClick={() => toggleSort("jogos")}
                    >
                      <span className="flex items-center gap-1">
                        Jogos <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.atletas.map((atleta) => {
                    const status = STATUS_MAP[atleta.status_id];
                    return (
                      <tr
                        key={atleta.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3">
                          <Link
                            href={`/atletas/${atleta.id}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {atleta.apelido}
                          </Link>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {atleta.clube_nome || "-"}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {atleta.posicao_nome || "-"}
                        </td>
                        <td className="py-3">
                          {status ? (
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          ) : (
                            <Badge variant="muted">-</Badge>
                          )}
                        </td>
                        <td className="py-3 font-medium text-foreground">
                          {formatNumber(atleta.media_num)}
                        </td>
                        <td className="py-3 text-foreground">
                          {formatCurrency(atleta.preco_num)}
                        </td>
                        <td className="py-3 text-foreground">
                          {formatNumber(atleta.pontos_num)}
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "font-medium",
                              atleta.variacao_num > 0
                                ? "text-success"
                                : atleta.variacao_num < 0
                                  ? "text-danger"
                                  : "text-muted-foreground"
                            )}
                          >
                            {atleta.variacao_num > 0 ? "+" : ""}
                            {formatCurrency(atleta.variacao_num)}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {atleta.jogos_num}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
