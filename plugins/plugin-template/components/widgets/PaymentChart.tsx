/**
 * Payment Chart Widget
 * Simple SVG-based charts without external dependencies
 */

import { useMemo } from "react";
import { CHART_COLORS } from "../../utils/constants";
import { formatCompactNumber, formatCurrency } from "../../utils/formatters";

interface ChartData {
  date: string;
  amount: number;
  count: number;
}

interface PaymentChartProps {
  data: ChartData[];
  type?: "line" | "bar" | "area";
  currency?: string;
  height?: number;
  showCount?: boolean;
}

export function PaymentChart({
  data,
  type = "line",
  currency = "USD",
  height = 350,
  showCount = false,
}: PaymentChartProps) {
  // Calculate chart dimensions and scales
  const chartDimensions = useMemo(() => {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800; // Will be scaled with viewBox
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxAmount = Math.max(...data.map((d) => d.amount));
    const minAmount = Math.min(...data.map((d) => d.amount));
    const yScale = (value: number) => {
      const range = maxAmount - minAmount || 1;
      return innerHeight - ((value - minAmount) / range) * innerHeight;
    };

    const xScale = (index: number) =>
      (index / (data.length - 1 || 1)) * innerWidth;

    return {
      margin,
      width,
      innerWidth,
      innerHeight,
      yScale,
      xScale,
      maxAmount,
      minAmount,
    };
  }, [data, height]);

  const {
    margin,
    width,
    innerWidth,
    innerHeight,
    yScale,
    xScale,
    maxAmount,
    minAmount,
  } = chartDimensions;

  // Generate path for line/area charts
  const linePath = useMemo(() => {
    if (data.length === 0) return "";

    const points = data.map((d, i) => `${xScale(i)},${yScale(d.amount)}`);
    return `M ${points.join(" L ")}`;
  }, [data, xScale, yScale]);

  // Generate area path
  const areaPath = useMemo(() => {
    if (data.length === 0 || type !== "area") return "";

    const topPoints = data.map((d, i) => `${xScale(i)},${yScale(d.amount)}`);
    const bottomPoints = data
      .map((_, i) => `${xScale(i)},${innerHeight}`)
      .reverse();

    return `M ${topPoints.join(" L ")} L ${bottomPoints.join(" L ")} Z`;
  }, [data, type, xScale, yScale, innerHeight]);

  // Render Y-axis labels
  const yAxisTicks = useMemo(() => {
    const tickCount = 5;
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const value = minAmount + (maxAmount - minAmount) * (i / tickCount);
      const y = yScale(value);
      ticks.push({ value, y });
    }
    return ticks;
  }, [minAmount, maxAmount, yScale]);

  // Handle empty data
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid lines */}
          <g className="text-muted-foreground opacity-20">
            {yAxisTicks.map((tick, i) => (
              <line
                key={i}
                x1={0}
                y1={tick.y}
                x2={innerWidth}
                y2={tick.y}
                stroke="currentColor"
                strokeDasharray="2,2"
              />
            ))}
          </g>

          {/* Y-axis */}
          <g className="text-muted-foreground text-xs">
            {yAxisTicks.map((tick, i) => (
              <text
                key={i}
                x={-10}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="currentColor"
              >
                {formatCompactNumber(tick.value)}
              </text>
            ))}
          </g>

          {/* X-axis */}
          <g className="text-muted-foreground text-xs">
            {data.map((d, i) => {
              // Show fewer labels if there are many data points
              if (data.length > 10 && i % Math.ceil(data.length / 10) !== 0)
                return null;

              const date = new Date(d.date);
              const label = `${date.getMonth() + 1}/${date.getDate()}`;

              return (
                <text
                  key={i}
                  x={xScale(i)}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {label}
                </text>
              );
            })}
          </g>

          {/* Chart content */}
          {type === "bar" && (
            <g>
              {data.map((d, i) => {
                const barWidth = (innerWidth / data.length) * 0.8;
                const x = xScale(i) - barWidth / 2;
                const barHeight = innerHeight - yScale(d.amount);

                return (
                  <rect
                    key={i}
                    x={x}
                    y={yScale(d.amount)}
                    width={barWidth}
                    height={barHeight}
                    fill={CHART_COLORS.primary}
                    opacity={0.8}
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <title>{`${d.date}: ${formatCurrency(d.amount, currency)}`}</title>
                  </rect>
                );
              })}
            </g>
          )}

          {type === "area" && (
            <>
              <path d={areaPath} fill={CHART_COLORS.primary} opacity={0.3} />
              <path
                d={linePath}
                fill="none"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
              />
            </>
          )}

          {type === "line" && (
            <>
              <path
                d={linePath}
                fill="none"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
              />
              {/* Data points */}
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={xScale(i)}
                  cy={yScale(d.amount)}
                  r={3}
                  fill={CHART_COLORS.primary}
                  className="hover:r-5 transition-all cursor-pointer"
                >
                  <title>{`${d.date}: ${formatCurrency(d.amount, currency)}`}</title>
                </circle>
              ))}
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

/**
 * Mini chart for compact displays
 */
export function MiniChart({
  data,
  color = CHART_COLORS.primary,
}: {
  data: number[];
  color?: string;
}) {
  if (data.length === 0) return null;

  const width = 100;
  const height = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

/**
 * Sparkline chart for inline displays
 */
export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = CHART_COLORS.primary,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1} />
    </svg>
  );
}
