import type { SVGProps } from "react";

type MergedCursorProps = SVGProps<SVGLineElement> & {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: unknown;
  payloadIndex?: number;
};

/** BarChart tooltip cursor: vertical line at band center instead of the default fill. */
export function RechartsBarHoverCursor(props: MergedCursorProps) {
  const { x = 0, y = 0, width = 0, height = 0, className } = props;
  if (width <= 0 || height <= 0) return null;
  const cx = x + width / 2;
  return (
    <line
      x1={cx}
      x2={cx}
      y1={y}
      y2={y + height}
      stroke="var(--chart-bar-hover-line)"
      strokeWidth={1}
      strokeOpacity={0.92}
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
      className={className}
    />
  );
}
