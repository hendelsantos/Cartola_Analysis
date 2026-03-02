"use client";

import { useEffect, useState } from "react";
import { getAtletas, getClubes, type Atleta, type Clube } from "@/lib/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function ValorizacoesPage() {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAtletas({ per_page: 50, ordem: "variacao", direcao: "desc" })
      .then((r) => setAtletas(r.atletas))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const top15 = atletas.slice(0, 15);
  const chartData = top15.map((a) => ({
    nome: a.apelido_abreviado || a.apelido.slice(0, 10),
    variacao: a.variacao_num,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Valorizações</h1>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Valorizações</h1>
        <p className="text-sm text-muted-foreground">
          Variação de preço dos atletas
        </p>
      </div>

      {/* Chart */}
      <Card title="Top 15 Valorizações" subtitle="Variação em cartoletas (C$)">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis type="number" stroke="#a0a0b8" fontSize={12} />
              <YAxis
                type="category"
                dataKey="nome"
                stroke="#a0a0b8"
                fontSize={11}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #2a2a4a",
                  borderRadius: "8px",
                  color: "#f0f0f0",
                }}
                formatter={(value: number) => [
                  `C$ ${value.toFixed(2)}`,
                  "Variação",
                ]}
              />
              <Bar
                dataKey="variacao"
                fill="#00c853"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Table */}
      <Card title="Todas as Variações">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Atleta</th>
                <th className="pb-3 font-medium">Clube</th>
                <th className="pb-3 font-medium">Posição</th>
                <th className="pb-3 font-medium">Preço</th>
                <th className="pb-3 font-medium">Variação</th>
                <th className="pb-3 font-medium">Média</th>
              </tr>
            </thead>
            <tbody>
              {atletas.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/50 hover:bg-muted/50"
                >
                  <td className="py-3 font-medium text-foreground">
                    {a.apelido}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {a.clube_nome}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {a.posicao_nome}
                  </td>
                  <td className="py-3 text-foreground">
                    {formatCurrency(a.preco_num)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      {a.variacao_num > 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : a.variacao_num < 0 ? (
                        <TrendingDown className="h-3 w-3 text-danger" />
                      ) : null}
                      <span
                        className={cn(
                          "font-medium",
                          a.variacao_num > 0
                            ? "text-success"
                            : a.variacao_num < 0
                              ? "text-danger"
                              : "text-muted-foreground"
                        )}
                      >
                        {a.variacao_num > 0 ? "+" : ""}
                        {formatCurrency(a.variacao_num)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-foreground">
                    {formatNumber(a.media_num)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
