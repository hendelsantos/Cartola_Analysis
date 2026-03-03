import { Card } from "@/components/ui/card";
import {
  Trophy,
  BarChart3,
  Database,
  Cpu,
  TrendingUp,
  Users,
  Github,
  Linkedin,
  Mail,
  Target,
  Zap,
  Shield,
  Code2,
  Brain,
  LineChart,
  Layers,
} from "lucide-react";

const techStack = [
  {
    category: "Backend",
    icon: Database,
    items: [
      { name: "Python", detail: "Linguagem principal" },
      { name: "FastAPI", detail: "Framework assíncrono" },
      { name: "SQLAlchemy 2.0", detail: "ORM com async/await" },
      { name: "PostgreSQL", detail: "Banco de dados" },
      { name: "Alembic", detail: "Migrações" },
    ],
  },
  {
    category: "Frontend",
    icon: Code2,
    items: [
      { name: "Next.js 15+", detail: "React framework" },
      { name: "React 19", detail: "UI library" },
      { name: "Tailwind CSS 4", detail: "Estilização" },
      { name: "TypeScript", detail: "Type safety" },
      { name: "Recharts", detail: "Visualizações" },
    ],
  },
  {
    category: "Data Science",
    icon: Brain,
    items: [
      { name: "Média Ponderada Móvel", detail: "Previsão temporal" },
      { name: "Análise de Scouts", detail: "Decomposição de pontuação" },
      { name: "Otimização Knapsack", detail: "Escalação ótima" },
      { name: "Análise de Risco", detail: "Volatilidade e consistência" },
      { name: "ETL Pipeline", detail: "Sync com API oficial" },
    ],
  },
  {
    category: "Infraestrutura",
    icon: Layers,
    items: [
      { name: "Railway", detail: "Deploy e hosting" },
      { name: "Docker", detail: "Containerização" },
      { name: "GitHub Actions", detail: "CI/CD" },
      { name: "REST API", detail: "Arquitetura" },
      { name: "Pydantic v2", detail: "Validação" },
    ],
  },
];

const features = [
  {
    icon: BarChart3,
    title: "Analytics Avançado",
    desc: "Dashboard com métricas em tempo real, rankings e tendências",
  },
  {
    icon: Target,
    title: "Previsões Estatísticas",
    desc: "Projeções usando WMA, scouts e dificuldade do adversário",
  },
  {
    icon: Zap,
    title: "Escalação Inteligente",
    desc: "Otimização com 7 formações e 4 estratégias diferentes",
  },
  {
    icon: TrendingUp,
    title: "Valorizações",
    desc: "Análise de variação de preço e custo-benefício",
  },
  {
    icon: Users,
    title: "700+ Atletas",
    desc: "Base completa sincronizada com a API oficial do Cartola",
  },
  {
    icon: LineChart,
    title: "Perfil de Scouts",
    desc: "Decomposição detalhada da pontuação por scout individual",
  },
];

export default function SobrePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="field-pattern relative overflow-hidden rounded-2xl border border-border/40">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-accent/5" />

        {/* Football field SVG */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg viewBox="0 0 800 400" className="h-full w-full" fill="none" stroke="white" strokeWidth="1.5">
            {/* Outer field */}
            <rect x="40" y="20" width="720" height="360" rx="8" />
            {/* Center line */}
            <line x1="400" y1="20" x2="400" y2="380" />
            {/* Center circle */}
            <circle cx="400" cy="200" r="60" />
            <circle cx="400" cy="200" r="3" fill="white" />
            {/* Left penalty area */}
            <rect x="40" y="100" width="120" height="200" />
            <rect x="40" y="140" width="50" height="120" />
            <circle cx="130" cy="200" r="3" fill="white" />
            {/* Right penalty area */}
            <rect x="640" y="100" width="120" height="200" />
            <rect x="710" y="140" width="50" height="120" />
            <circle cx="670" cy="200" r="3" fill="white" />
            {/* Corner arcs */}
            <path d="M40 35 Q55 20 70 20" />
            <path d="M730 20 Q745 20 760 35" />
            <path d="M40 365 Q55 380 70 380" />
            <path d="M730 380 Q745 380 760 365" />
          </svg>
        </div>

        <div className="relative z-10 px-5 py-10 sm:px-10 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Logo */}
            <div className="mb-6 inline-flex">
              <div className="animated-border rounded-2xl p-[2px]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card sm:h-20 sm:w-20">
                  <Trophy className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                </div>
              </div>
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">
              Portfolio de Data Analytics
            </p>

            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
              <span className="gradient-text">Cartola</span>{" "}
              Analytics Pro
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Sistema profissional de análise de dados e estatísticas do Cartola FC,
              desenvolvido como projeto de portfolio demonstrando habilidades em
              Data Analytics, Machine Learning e Engenharia de Software Full-Stack.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                FastAPI + Python
              </span>
              <span className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
                Next.js + React
              </span>
              <span className="rounded-full bg-success/10 px-4 py-1.5 text-xs font-semibold text-success">
                PostgreSQL
              </span>
              <span className="rounded-full bg-warning/10 px-4 py-1.5 text-xs font-semibold text-warning">
                Data Science
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* About the author */}
      <Card glass>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Avatar */}
          <div className="flex shrink-0 flex-col items-center">
            <div className="animated-border rounded-full p-[2px]">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-card to-muted sm:h-28 sm:w-28">
                <span className="text-3xl font-extrabold gradient-text sm:text-4xl">HS</span>
              </div>
            </div>
            <h2 className="mt-3 text-lg font-bold text-foreground sm:text-xl">
              Hendel Santos
            </h2>
            <p className="text-xs text-muted-foreground">
              Data Analytics &amp; Full-Stack Developer
            </p>
          </div>

          {/* Bio */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Este projeto foi desenvolvido como um <strong className="text-foreground">portfolio de análise de dados e estatística</strong>,
              demonstrando competências em coleta, processamento e visualização de dados esportivos.
              O sistema integra técnicas de <strong className="text-foreground">data science</strong> como
              médias ponderadas móveis, análise de scouts, cálculo de risco/volatilidade
              e otimização combinatória para montagem automática de escalações.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Todo o pipeline — desde a <strong className="text-foreground">ingestão de dados via API</strong>,
              passando pelo <strong className="text-foreground">armazenamento em banco relacional</strong>,
              até a <strong className="text-foreground">apresentação em dashboards interativos</strong> — foi
              construído do zero com arquitetura profissional e boas práticas de engenharia.
            </p>

            {/* Social links */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <a
                href="https://github.com/hendelsantos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/hendelsantos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href="mailto:hendel@email.com"
                className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                Contato
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
          Funcionalidades
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/40 bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md sm:p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
          Stack Tecnológica
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {techStack.map((group) => (
            <Card key={group.category}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <group.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {group.category}
                </h3>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="text-muted-foreground">{item.detail}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Architecture diagram description */}
      <Card glass>
        <h2 className="mb-3 text-sm font-bold text-foreground sm:text-base">
          Arquitetura do Sistema
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-6 w-6" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-foreground">Dados</h4>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              API Cartola FC → ETL Pipeline → PostgreSQL com 6 modelos normalizados
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Cpu className="h-6 w-6" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-foreground">Processamento</h4>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              FastAPI async → PredictionService → WMA + Scout Analysis + Knapsack
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-foreground">Visualização</h4>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Next.js 15+ SSR → Dashboards interativos → Deploy Railway
            </p>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="border-t border-border/30 pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Desenvolvido por <strong className="text-foreground">Hendel Santos</strong> ·
          Portfolio de Análise de Dados e Estatística · 2026
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          Este projeto não é afiliado ao Cartola FC ou Globo. Dados obtidos via API pública.
        </p>
      </div>
    </div>
  );
}
