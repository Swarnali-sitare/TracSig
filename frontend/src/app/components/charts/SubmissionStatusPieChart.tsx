import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import React from "react";

export type SubmissionStatusSlice = { name: string; value: number; color: string };

type LegendPayloadEntry = {
  value?: string;
  color?: string;
  payload?: { name?: string; value?: number };
};

type Props = {
  data: SubmissionStatusSlice[];
};

export function SubmissionStatusPieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  const renderLegend = (props: { payload?: LegendPayloadEntry[] }) => {
    const { payload } = props;
    if (!payload?.length) return null;
    return (
      <ul className="m-0 flex list-none flex-col gap-2 pl-2 text-sm" style={{ color: "var(--foreground)" }}>
        {payload.map((entry, i) => {
          const v = typeof entry.payload?.value === "number" ? entry.payload.value : 0;
          const name = entry.value ?? entry.payload?.name ?? "";
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <li key={i} className="flex items-center gap-2">
              <span
                className="inline-block size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span>
                {name}: {v} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="38%"
          cy="50%"
          outerRadius={88}
          paddingAngle={0}
          label={false}
          isAnimationActive={false}
          activeShape={false}
          stroke="var(--border-color)"
          strokeWidth={1}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--foreground)",
          }}
          formatter={(value: number, name: string) => {
            const v = typeof value === "number" ? value : 0;
            const pct = total > 0 ? Math.round((v / total) * 100) : 0;
            return [`${v} (${pct}%)`, name];
          }}
        />
        <Legend content={renderLegend} layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
