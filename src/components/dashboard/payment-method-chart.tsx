'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PaymentMethodChartProps {
  data: Record<string, number>;
}

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const chartData = Object.entries(data)
    .map(([method, count]) => ({
      method: formatPaymentMethod(method),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 payment methods

  function formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'BTC-OnChain': 'Bitcoin',
      'BTC-LightningNetwork': 'Lightning',
      'LTC-OnChain': 'Litecoin',
      'ETH-OnChain': 'Ethereum',
      'XMR-OnChain': 'Monero',
    };
    return methodMap[method] || method;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            type="number"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            dataKey="method" 
            type="category"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            width={80}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar 
            dataKey="count" 
            fill="hsl(var(--primary))" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}