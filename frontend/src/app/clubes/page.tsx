"use client";

import { useEffect, useState } from "react";
import { getClubes, type Clube } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

export default function ClubesPage() {
  const [clubes, setClubes] = useState<Clube[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(false);
    getClubes()
      .then((r) => setClubes(r.clubes))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Clubes</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Clubes</h1>
        <ErrorAlert onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clubes</h1>
        <p className="text-sm text-muted-foreground">
          {clubes.length} clubes da Série A
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {clubes.map((clube) => (
          <Link key={clube.id} href={`/clubes/${clube.id}`}>
            <Card className="flex flex-col items-center gap-3 text-center transition-colors hover:border-primary/50">
              {clube.escudo_60 ? (
                <Image
                  src={clube.escudo_60}
                  alt={clube.nome_fantasia}
                  width={60}
                  height={60}
                  className="h-15 w-15"
                />
              ) : (
                <Shield className="h-15 w-15 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {clube.nome_fantasia}
                </p>
                <p className="text-xs text-muted-foreground">{clube.nome}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
