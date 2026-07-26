import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  sparklineData?: number[];
  color?: string;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
      <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

export function MetricCard({ label, value, icon: Icon, trend, trendUp, sparklineData, color = "#3b82f6" }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <Icon className="size-5 text-slate-500 dark:text-slate-400" />
          </div>
        )}
      </div>
      {sparklineData && (
        <div className="mt-4 flex items-end justify-end">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}
    </div>
  );
}
