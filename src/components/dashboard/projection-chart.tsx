'use client';

import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';

interface ProjectionChartProps {
  historical: Array<{
    month: string;
    revenue: number;
  }>;
  projections: Array<{
    month: string;
    revenue: number;
    isProjection: boolean;
  }>;
}

export function ProjectionChart({ historical, projections }: ProjectionChartProps) {
  // Combine historical and projection data
  const combinedData = [
    ...historical.map(item => ({ ...item, projection: null })),
    ...projections.map(item => ({ 
      month: item.month, 
      revenue: null,
      projection: item.revenue 
    })),
  ];

  // Add a connection point
  if (historical.length > 0 && projections.length > 0) {
    const lastHistorical = historical[historical.length - 1];
    combinedData[historical.length - 1] = {
      ...lastHistorical,
      projection: lastHistorical.revenue,
    };
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip 
            formatter={(value: number) => value ? formatCurrency(value) : null}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
            name="Historical"
          />
          <Line 
            type="monotone" 
            dataKey="projection" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(var(--primary))' }}
            name="Projected"
          />
          {historical.length > 0 && (
            <ReferenceLine 
              x={historical[historical.length - 1].month} 
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              label="Current"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}