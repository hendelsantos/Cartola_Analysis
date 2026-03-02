"use client";

import { useEffect, useState } from "react";
import {
  getRankingPontuadores,
  getRankingValorizacoes,
  getRankingCustoBeneficio,
  type Atleta,
} from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type Tab = "pontuadores" | "valorizacoes" | "custo-beneficio";

export default function RankingsPage() {
  const [tab, setTab] = useState<Tab>("pontuadores");
  const [data, setData] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher =
      tab === "pontuadores"
        ? getRankingPontuadores
        : tab === "valorizacoes"
          ? getRankingValorizacoes
          : getRankingCustoBeneficio;

    fetcher(50)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "pontuadores", label: "Maiores Médias" },
    { key: "valorizacoes", label: "Valorizações" },
    { key: "custo-beneficio", label: "Custo-Benefício" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rankings</h1>
        <p className="text-sm text-muted-foreground">
          Os melhores atletas por categoria
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={15} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium w-12">#</th>
                  <th className="pb-3 font-medium">Atleta</th>
                  <th className="pb-3 font-medium">Clube</th>
                  <th className="pb-3 font-medium">Posição</th>
                  <th className="pb-3 font-medium">Média</th>
                  <th className="pb-3 font-medium">Preço</th>
                  <th className="pb-3 font-medium">Variação</th>
                  <th className="pb-3 font-medium">Jogos</th>
                </tr>
              </thead>
              <tbody>
                {data.map((atleta, i) => (
                  <tr
                    key={atleta.id}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="py-3">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i < 3
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/atletas/${atleta.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {atleta.apelido}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {atleta.clube_nome}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {atleta.posicao_nome}
                    </td>
                    <td className="py-3 font-medium text-foreground">
                      {formatNumber(atleta.media_num)}
                    </td>
                    <td className="py-3 text-foreground">
                      {formatCurrency(atleta.preco_num)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          atleta.variacao_num > 0
                            ? "success"
                            : atleta.variacao_num < 0
                              ? "danger"
                              : "muted"
                        }
                      >
                        {atleta.variacao_num > 0 ? "+" : ""}
                        {formatCurrency(atleta.variacao_num)}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {atleta.jogos_num}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
