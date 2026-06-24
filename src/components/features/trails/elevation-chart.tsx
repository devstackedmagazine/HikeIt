"use client";

import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";

export interface ElevationPoint {
  distance: number;
  elevation: number;
}

/**
 * Compact elevation profile rendered as discrete green bars (the tallest bar —
 * the high point — is brighter Moss, the rest darker Pine). No axes; three text
 * labels (start / mid / end) sit below per the design.
 */
export function ElevationChart({ data }: { data: ElevationPoint[] }) {
  if (data.length < 2) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const mid = data[Math.floor(data.length / 2)];
  if (!first || !last || !mid) return null;

  const maxElevation = Math.max(...data.map((d) => d.elevation));

  return (
    <div>
      <div className="h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            barCategoryGap={1}
          >
            <Bar dataKey="elevation" isAnimationActive={false}>
              {data.map((point, i) => (
                <Cell
                  key={i}
                  fill={point.elevation === maxElevation ? "#4CAF7D" : "#2D5F3F"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-between text-[8px] font-medium text-summit/30">
        <span>
          {first.distance.toFixed(1)}KM / {Math.round(first.elevation)}M
        </span>
        <span>~ {Math.round(mid.elevation)}M</span>
        <span>
          {last.distance.toFixed(1)}KM / {Math.round(last.elevation)}M
        </span>
      </div>
    </div>
  );
}
