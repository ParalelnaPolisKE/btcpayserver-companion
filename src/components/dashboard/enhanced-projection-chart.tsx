'use client';

import { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TimeFrame } from '@/app/actions/dashboard';
import { formatExpenseBreakdown } from '@/lib/expenses';

interface EnhancedProjectionChartProps {
  data: any;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  displayCurrency: 'EUR' | 'BTC';
  monthlyExpenses?: number;
  includeVat?: boolean;
}

export function EnhancedProjectionChart({ data, onTimeFrameChange, displayCurrency, monthlyExpenses = 0, includeVat = false }: EnhancedProjectionChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(data?.timeFrame || 'monthly');
  
  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No projection data available</p>
        </CardContent>
      </Card>
    );
  }

  const { historical, projections, trend, primaryCurrency, exchangeRate } = data;
  const btcRate = exchangeRate?.eur || 95000;

  // Convert between currencies if needed
  const convertValue = (value: number) => {
    if (displayCurrency === 'BTC') {
      if (primaryCurrency === 'EUR') {
        return value / btcRate;
      } else if (primaryCurrency === 'SATS' || primaryCurrency === 'sats') {
        // Convert SATS to BTC (1 BTC = 100,000,000 SATS)
        return value / 100000000;
      }
    } else if (displayCurrency === 'EUR') {
      if (primaryCurrency === 'SATS' || primaryCurrency === 'sats') {
        // Convert SATS to EUR via BTC
        return (value / 100000000) * btcRate;
      }
    }
    return value;
  };

  // Combine historical and projection data
  const combinedData = [
    ...historical.map((item: any) => ({ 
      ...item, 
      revenue: convertValue(item.revenue),
      projection: null 
    })),
    ...projections.map((item: any) => ({ 
      period: item.period, 
      revenue: null,
      projection: convertValue(item.revenue) 
    })),
  ];

  // Add a connection point for smooth transition
  if (historical.length > 0 && projections.length > 0) {
    const lastHistorical = historical[historical.length - 1];
    combinedData[historical.length - 1] = {
      ...combinedData[historical.length - 1],
      projection: convertValue(lastHistorical.revenue),
    };
  }

  const formatCurrency = (value: number) => {
    if (displayCurrency === 'BTC') {
      return `₿${value.toFixed(4)}`;
    }
    
    if (primaryCurrency === 'SATS' || primaryCurrency === 'sats') {
      return `${value.toLocaleString()} SATS`;
    }
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${value.toLocaleString()} ${displayCurrency}`;
    }
  };

  const formatXAxisTick = (value: string) => {
    switch (timeFrame) {
      case 'daily':
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        const weekDate = new Date(value);
        return `Week of ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        const [year, month] = value.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      case 'quarterly':
        return value;
      case 'yearly':
        return value;
      default:
        return value;
    }
  };

  const handleTimeFrameChange = (value: TimeFrame) => {
    setTimeFrame(value);
    onTimeFrameChange(value);
  };

  // Convert monthly expenses if needed
  const convertedExpenses = convertValue(monthlyExpenses, 'EUR');
  
  // Calculate max value for better Y axis scaling
  const allValues = [...combinedData.map(d => d.revenue || d.projection || 0), convertedExpenses];
  const maxValue = Math.max(...allValues) * 1.1; // Add 10% padding

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue / Revenue Projections</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Based on historical data and trends
              {trend && (
                <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                   trend === 'down' ? <TrendingDown className="h-3 w-3" /> : 
                   <Minus className="h-3 w-3" />}
                  Trend: {trend}
                </span>
              )}
            </CardDescription>
          </div>
          <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#e9d5ff" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={formatXAxisTick}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={Math.floor(combinedData.length / 10)} // Show ~10 labels
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={formatCurrency}
                domain={[0, maxValue]}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (!value) return null;
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => formatXAxisTick(label)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                content={(props) => {
                  const { active, payload, label } = props;
                  if (!active || !payload) return null;
                  
                  return (
                    <div className="bg-background p-3 border rounded-md shadow-md">
                      <p className="font-semibold mb-2">{formatXAxisTick(label)}</p>
                      {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: {formatCurrency(entry.value)}
                        </p>
                      ))}
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-red-500">
                          Monthly Expenses: {formatCurrency(convertedExpenses)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(payload[0]?.value || 0) > convertedExpenses ? '✓ Above expenses' : '✗ Below expenses'}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Historical"
              />
              <Area 
                type="monotone" 
                dataKey="projection" 
                stroke="#a855f7" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorProjection)"
                name="Projected"
              />
              {historical.length > 0 && (
                <ReferenceLine 
                  x={historical[historical.length - 1].period} 
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: "Current", position: "top" }}
                />
              )}
              <ReferenceLine 
                y={convertedExpenses} 
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ 
                  value: `Monthly Expenses ${includeVat ? '(incl. VAT)' : '(excl. VAT)'}`, 
                  position: "right",
                  fill: "#ef4444"
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Historical Data Points</p>
            <p className="font-semibold">{historical.length}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Projection Period</p>
            <p className="font-semibold">{projections.length} {timeFrame === 'daily' ? 'days' : timeFrame === 'weekly' ? 'weeks' : timeFrame}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Display Currency</p>
            <p className="font-semibold">{displayCurrency}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">BTC/EUR Rate</p>
            <p className="font-semibold">€{btcRate.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}