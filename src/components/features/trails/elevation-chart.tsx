"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ElevationPoint {
  distance: number;
  elevation: number;
}

export function ElevationChart({ data }: { data: ElevationPoint[] }) {
  if (data.length < 2) return null;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D5F3F" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#2D5F3F" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="distance"
            tickFormatter={(v: number) => `${v}km`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
          />
          <YAxis
            tickFormatter={(v: number) => `${v}m`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            width={48}
          />
          <Tooltip
            formatter={(value) => [`${String(value)} m`, "Lartësia"]}
            labelFormatter={(label) => `${String(label)} km`}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="#2D5F3F"
            strokeWidth={2}
            fill="url(#elev)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
