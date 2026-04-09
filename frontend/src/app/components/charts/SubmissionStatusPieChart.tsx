import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import React from "react";

const PIE_HOVER_RADIUS_BUMP = 12;

type SectorLike = {
  cx?: number;
  cy?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
};

function PieActiveShape(props: SectorLike) {
  const cx = props.cx ?? 0;
  const cy = props.cy ?? 0;
  const inner = Number(props.innerRadius) || 0;
  const outer = Number(props.outerRadius) || 0;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={inner}
      outerRadius={outer + PIE_HOVER_RADIUS_BUMP}
      startAngle={props.startAngle}
      endAngle={props.endAngle}
      fill={props.fill}
      stroke="var(--border-color)"
      strokeWidth={1}
    />
  );
}

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
          activeShape={PieActiveShape}
          stroke="var(--border-color)"
          strokeWidth={1}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0];
            const name = String(item.name ?? "");
            const raw = item.value;
            const v = typeof raw === "number" ? raw : Number(raw) || 0;
            const pct = total > 0 ? Math.round((v / total) * 100) : 0;
            return (
              <div className="submission-status-pie-tooltip rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
                <p className="font-medium text-card-foreground">{name}</p>
                <p className="text-muted-foreground">
                  {v} ({pct}%)
                </p>
              </div>
            );
          }}
        />
        <Legend content={renderLegend} layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
