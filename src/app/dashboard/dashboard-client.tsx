'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, Package } from 'lucide-react';
import { StatusBreakdown } from '@/components/dashboard/status-breakdown';
import { PaymentMethodChart } from '@/components/dashboard/payment-method-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { MetricCard } from '@/components/dashboard/metric-card';
import { EnhancedProjectionChart } from '@/components/dashboard/enhanced-projection-chart';
import { getRevenueProjection, TimeFrame } from '@/app/actions/dashboard';
import { Button } from '@/components/ui/button';

interface DashboardClientProps {
  metrics: any;
}

export default function DashboardClient({ metrics }: DashboardClientProps) {
  const [projections, setProjections] = useState<any>(null);
  const [loadingProjections, setLoadingProjections] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'EUR' | 'BTC'>('EUR');
  
  const btcRate = metrics.exchangeRate?.eur || 95000;
  
  const loadProjections = useCallback(async (timeFrame: TimeFrame) => {
    setLoadingProjections(true);
    try {
      const data = await getRevenueProjection(timeFrame);
      setProjections(data);
    } catch (error) {
      console.error('Failed to load projections:', error);
    } finally {
      setLoadingProjections(false);
    }
  }, []);
  
  // Load initial projections
  useEffect(() => {
    loadProjections('monthly');
  }, [loadProjections]);
  
  // Convert values based on display currency
  const convertValue = (value: number, fromCurrency?: string) => {
    const sourceCurrency = fromCurrency || metrics.primaryCurrency || 'EUR';
    
    if (displayCurrency === 'BTC') {
      if (sourceCurrency === 'EUR') {
        return value / btcRate;
      } else if (sourceCurrency === 'SATS' || sourceCurrency === 'sats') {
        return value / 100000000; // 1 BTC = 100M SATS
      } else if (sourceCurrency === 'USD') {
        // Convert USD to BTC using USD rate
        const usdRate = metrics.exchangeRate?.usd || 100000;
        return value / usdRate;
      }
    } else if (displayCurrency === 'EUR') {
      if (sourceCurrency === 'SATS' || sourceCurrency === 'sats') {
        return (value / 100000000) * btcRate;
      } else if (sourceCurrency === 'USD') {
        // Convert USD to EUR via BTC
        const usdRate = metrics.exchangeRate?.usd || 100000;
        return (value / usdRate) * btcRate;
      }
    }
    
    return value;
  };
  
  const formatCurrency = (amount: number, currency?: string) => {
    const cur = currency || metrics.primaryCurrency || 'EUR';
    const convertedAmount = convertValue(amount, cur);
    
    if (displayCurrency === 'BTC') {
      return `₿${convertedAmount.toFixed(4)}`;
    }
    
    // Handle SATS (satoshis) - custom format
    if (cur === 'SATS' || cur === 'Sats' || cur === 'sats') {
      if (displayCurrency === 'EUR') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'EUR',
        }).format(convertedAmount);
      }
      return `${amount.toLocaleString()} SATS`;
    }
    
    // Handle standard currency codes
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
      }).format(convertedAmount);
    } catch (error) {
      // Fallback for any other non-standard currency codes
      return `${convertedAmount.toLocaleString()} ${displayCurrency}`;
    }
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {metrics.storeInfo?.name || 'BTCPay Store'} Analytics
          </p>
        </div>
        <div className="flex gap-2">
          {metrics.isUsingMockData && (
            <Alert className="w-auto">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Using mock data. Connect to BTCPayServer for real analytics.
              </AlertDescription>
            </Alert>
          )}
          {metrics.outlierInfo?.hasMixedCurrencies && (
            <Alert className="w-auto">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Multiple currencies detected. Showing {metrics.primaryCurrency} metrics.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Currency Switcher */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Display currency:</span>
          <div className="flex">
            <Button
              variant={displayCurrency === 'EUR' ? 'default' : 'outline'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setDisplayCurrency('EUR')}
            >
              € EUR
            </Button>
            <Button
              variant={displayCurrency === 'BTC' ? 'default' : 'outline'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setDisplayCurrency('BTC')}
            >
              ₿ BTC
            </Button>
          </div>
          {displayCurrency === 'BTC' && (
            <span className="text-sm text-muted-foreground ml-2">
              (1 BTC = €{btcRate.toLocaleString()})
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          description={`Current month revenue (${displayCurrency})`}
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
          title="Typical Transaction"
          value={formatCurrency(metrics.medianTransactionValue)}
          description={`Median (Avg: ${formatCurrency(metrics.avgTransactionValue)})`}
          icon={<CreditCard className="h-4 w-4" />}
          trend={metrics.outlierInfo?.hasLargeTransactions ? 'neutral' : undefined}
          trendValue={metrics.outlierInfo?.hasLargeTransactions ? `Max: ${formatCurrency(metrics.outlierInfo.largestTransaction)}` : undefined}
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          {loadingProjections ? (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Loading projections...</p>
              </CardContent>
            </Card>
          ) : (
            <EnhancedProjectionChart 
              data={projections}
              onTimeFrameChange={loadProjections}
              displayCurrency={displayCurrency}
            />
          )}
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
          
          {metrics.currencyStats && metrics.currencyStats.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Currency Breakdown</CardTitle>
                <CardDescription>Revenue by currency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.currencyStats.map((stat: any) => (
                    <div key={stat.currency} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <span className="font-medium">{stat.currency}</span>
                        <span className="text-sm text-muted-foreground ml-2">({stat.count} invoices)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(stat.total, stat.currency)}</div>
                        <div className="text-sm text-muted-foreground">Avg: {formatCurrency(stat.average, stat.currency)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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