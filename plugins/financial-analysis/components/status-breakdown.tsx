"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface StatusBreakdownProps {
  data: Record<string, number>;
}

export function StatusBreakdown({ data }: StatusBreakdownProps) {
  const COLORS = {
    Settled: "hsl(var(--chart-1))",
    Processing: "hsl(var(--chart-2))",
    Expired: "hsl(var(--chart-3))",
    Invalid: "hsl(var(--chart-4))",
    New: "hsl(var(--chart-5))",
  };

  const chartData = Object.entries(data).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  COLORS[entry.name as keyof typeof COLORS] ||
                  "hsl(var(--muted))"
                }
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              "Count",
            ]}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry: any) =>
              `${value}: ${entry.payload.value}`
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
