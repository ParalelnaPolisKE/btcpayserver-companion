'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, Package } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { StatusBreakdown } from '@/components/dashboard/status-breakdown';
import { PaymentMethodChart } from '@/components/dashboard/payment-method-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ProjectionChart } from '@/components/dashboard/projection-chart';

interface DashboardClientProps {
  metrics: any;
  projections: any;
}

export default function DashboardClient({ metrics, projections }: DashboardClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: metrics.storeInfo?.defaultCurrency || 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {metrics.storeInfo?.name || 'BTCPay Store'} Analytics
          </p>
        </div>
        {metrics.isUsingMockData && (
          <Alert className="w-auto">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Using mock data. Connect to BTCPayServer for real analytics.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          description="Current month revenue"
          icon={<DollarSign className="h-4 w-4" />}
          trend={metrics.growthRate > 0 ? 'up' : metrics.growthRate < 0 ? 'down' : 'neutral'}
          trendValue={formatPercentage(metrics.growthRate)}
        />
        
        <MetricCard
          title="Total Invoices"
          value={metrics.totalInvoices.toString()}
          description={`${metrics.settledInvoices} settled`}
          icon={<Receipt className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Average Transaction"
          value={formatCurrency(metrics.avgTransactionValue)}
          description="Per settled invoice"
          icon={<CreditCard className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${((metrics.settledInvoices / metrics.totalInvoices) * 100).toFixed(1)}%`}
          description="Settled / Total"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={metrics.revenueByMonth} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Projections</CardTitle>
              <CardDescription>
                Based on historical data and trends
                {projections?.trend && (
                  <span className={`ml-2 inline-flex items-center gap-1 text-sm ${
                    projections.trend === 'up' ? 'text-green-600' : 
                    projections.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {projections.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                     projections.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                    Trend: {projections.trend}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projections ? (
                <ProjectionChart 
                  historical={projections.historical} 
                  projections={projections.projections} 
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No projection data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBreakdown data={metrics.statusBreakdown} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Popular payment options</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodChart data={metrics.paymentMethodBreakdown} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling items by invoice count</CardDescription>
            </CardHeader>
            <CardContent>
              <TopProducts products={metrics.topProducts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}