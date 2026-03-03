/** Shared position badge and sparkline components. */

export const POS_COLORS: Record<string, string> = {
  GOL: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LAT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ZAG: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEI: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ATA: "bg-red-500/20 text-red-400 border-red-500/30",
  TEC: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function PosBadge({ pos }: { pos: string }) {
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${POS_COLORS[pos] || POS_COLORS["TEC"]}`}
    >
      {pos}
    </span>
  );
}

export function MiniSparkline({
  data,
  className = "",
}: {
  data: number[];
  className?: string;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  return (
    <div className={`flex items-end gap-[2px] h-6 ${className}`}>
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-t transition-all ${v > 0 ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ height: `${Math.max(8, ((v - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function MoneyballStatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-emerald-400",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
