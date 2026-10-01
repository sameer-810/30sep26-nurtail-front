import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/lib/utils";

/** Weight over time — a single calm series in forest, no legend needed. */
export function WeightChart({ points }: { points: { date: string; kg: number }[] }) {
  const data = [...points]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((p) => ({ ...p, label: formatDate(p.date) }));
  const kgs = data.map((d) => d.kg);
  const pad = Math.max(0.5, (Math.max(...kgs) - Math.min(...kgs)) * 0.4);
  return (
    <div
      className="mt-3 h-40"
      role="img"
      aria-label={`Weight from ${data[0].kg} kg to ${data[data.length - 1].kg} kg`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[Math.floor(Math.min(...kgs) - pad), Math.ceil(Math.max(...kgs) + pad)]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            unit=" kg"
            width={52}
          />
          <Tooltip
            formatter={(v) => [`${v} kg`, "Weight"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="kg"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#wfill)"
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
