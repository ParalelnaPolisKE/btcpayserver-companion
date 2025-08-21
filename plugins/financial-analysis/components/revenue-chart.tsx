"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
  }>;
  monthlyExpenses?: number;
  includeVat?: boolean;
  displayCurrency?: "EUR" | "BTC";
}

export function RevenueChart({
  data,
  monthlyExpenses = 0,
  includeVat = false,
  displayCurrency = "EUR",
}: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            className="text-xs"
            tick={{ fill: "currentColor" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "currentColor" }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revenueGradient)"
            name="Revenue"
          />
          {monthlyExpenses > 0 && (
            <ReferenceLine
              y={monthlyExpenses}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Monthly Expenses ${includeVat ? "(incl. VAT)" : "(excl. VAT)"}`,
                position: "right",
                fill: "#ef4444",
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
