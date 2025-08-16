/**
 * Main Payment Analytics Component
 * Demonstrates data fetching, state management, and UI composition
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Settings } from 'lucide-react';
import { usePaymentData } from '../hooks/usePaymentData';
import { usePluginSettings } from '../hooks/usePluginSettings';
import { MetricCard } from './widgets/MetricCard';
import { PaymentChart } from './widgets/PaymentChart';
import { TransactionList } from './widgets/TransactionList';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TimePeriod } from '../types';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';

export default function PaymentAnalytics() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const { settings, updateSettings } = usePluginSettings();
  
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching
  } = usePaymentData(timePeriod);

  // Calculate derived metrics
  const metrics = useMemo(() => {
    if (!data) return null;
    
    return {
      revenue: data.totalRevenue,
      transactions: data.totalTransactions,
      average: data.averageTransaction,
      growth: calculateGrowth(data),
    };
  }, [data]);

  // Handle data export
  const handleExport = () => {
    if (!data) return;
    
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-analytics-${timePeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load payment data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze your payment data from BTCPay Server
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics?.revenue || 0, settings.displayCurrency)}
          change={metrics?.growth?.revenue}
          trend={metrics?.growth?.revenue > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Total Transactions"
          value={formatCompactNumber(metrics?.transactions || 0)}
          change={metrics?.growth?.transactions}
          trend={metrics?.growth?.transactions > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Average Transaction"
          value={formatCurrency(metrics?.average || 0, settings.displayCurrency)}
          change={metrics?.growth?.average}
          trend={metrics?.growth?.average > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Success Rate"
          value={`${((data?.statusBreakdown?.Settled || 0) / (data?.totalTransactions || 1) * 100).toFixed(1)}%`}
          subtitle="Settled transactions"
        />
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Daily revenue for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentChart
                data={data?.revenueByDay || []}
                type={settings.chartType}
                currency={settings.displayCurrency}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList timePeriod={timePeriod} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Distribution of payment methods used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topPaymentMethods?.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{method.method}</span>
                      <span className="text-sm text-muted-foreground">
                        ({method.count} transactions)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${method.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {method.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function calculateGrowth(data: any) {
  // Calculate growth compared to previous period
  // This is a simplified example
  return {
    revenue: 12.5,
    transactions: 8.2,
    average: 4.1,
  };
}

function convertToCSV(data: any): string {
  // Convert analytics data to CSV format
  const headers = ['Date', 'Revenue', 'Transactions'];
  const rows = data.revenueByDay.map((day: any) => 
    [day.date, day.amount, day.count].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}