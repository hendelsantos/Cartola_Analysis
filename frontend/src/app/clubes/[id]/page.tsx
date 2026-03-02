"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getClubeAnalytics,
  getAtletas,
  type ClubeAnalytics,
  type Atleta,
} from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Target, Crosshair, UserCheck } from "lucide-react";
import Link from "next/link";

export default function ClubeDetailPage() {
  const params = useParams();
  const clubeId = Number(params.id);
  const [analytics, setAnalytics] = useState<ClubeAnalytics | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubeId) return;
    Promise.all([
      getClubeAnalytics(clubeId),
      getAtletas({ clube_id: clubeId, per_page: 50, ordem: "media", direcao: "desc" }),
    ])
      .then(([an, at]) => {
        setAnalytics(an);
        setAtletas(at.atletas);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clubeId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return <p className="text-muted-foreground">Clube não encontrado.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/clubes"
          className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{analytics.nome}</h1>
          <p className="text-sm text-muted-foreground">Análise do clube</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Média Pontuação"
          value={formatNumber(analytics.media_pontuacao)}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Total Gols"
          value={analytics.total_gols}
          icon={<Crosshair className="h-5 w-5" />}
        />
        <StatCard
          title="Total Assistências"
          value={analytics.total_assistencias}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Prováveis"
          value={analytics.jogadores_provaveis}
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      <Card title="Elenco" subtitle="Ordenado por média">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Atleta</th>
                <th className="pb-3 font-medium">Posição</th>
                <th className="pb-3 font-medium">Média</th>
                <th className="pb-3 font-medium">Preço</th>
                <th className="pb-3 font-medium">Jogos</th>
              </tr>
            </thead>
            <tbody>
              {atletas.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/50 hover:bg-muted/50"
                >
                  <td className="py-3">
                    <Link
                      href={`/atletas/${a.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {a.apelido}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {a.posicao_nome}
                  </td>
                  <td className="py-3 font-medium text-foreground">
                    {formatNumber(a.media_num)}
                  </td>
                  <td className="py-3 text-foreground">
                    {formatCurrency(a.preco_num)}
                  </td>
                  <td className="py-3 text-muted-foreground">{a.jogos_num}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
