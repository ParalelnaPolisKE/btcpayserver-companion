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
import { getRevenueProjection } from '@/services/dashboard-api';
import type { TimeFrame, DashboardMetrics } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STORES, ALL_STORES_ID } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { SLOVAK_VAT_RATE, formatExpenseBreakdown } from '@/lib/expenses';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DashboardClientProps {
  metrics: DashboardMetrics;
  selectedStoreId: string;
  showPosOnly: boolean;
}

export default function DashboardClient({ metrics, selectedStoreId, showPosOnly }: DashboardClientProps) {
  const [projections, setProjections] = useState<any>(null);
  const [loadingProjections, setLoadingProjections] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'EUR' | 'BTC'>('EUR');
  const [includeVat, setIncludeVat] = useState(false);
  const router = useRouter();
  
  const btcRate = metrics.exchangeRate?.eur || 95000;
  const isAllStores = selectedStoreId === ALL_STORES_ID;
  
  const loadProjections = useCallback(async (timeFrame: TimeFrame) => {
    setLoadingProjections(true);
    try {
      const data = await getRevenueProjection(
        timeFrame,
        isAllStores ? undefined : selectedStoreId,
        isAllStores,
        showPosOnly
      );
      setProjections(data);
    } catch (error) {
      console.error('Failed to load projections:', error);
    } finally {
      setLoadingProjections(false);
    }
  }, [selectedStoreId, isAllStores, showPosOnly]);
  
  // Load initial projections
  useEffect(() => {
    loadProjections('monthly');
  }, [loadProjections]);
  
  const handleStoreChange = (storeId: string) => {
    const params = new URLSearchParams();
    params.set('storeId', storeId);
    if (showPosOnly) params.set('posOnly', 'true');
    router.push(`/dashboard?${params.toString()}`);
  };
  
  const handlePosFilterToggle = () => {
    const params = new URLSearchParams();
    params.set('storeId', selectedStoreId);
    if (!showPosOnly) params.set('posOnly', 'true');
    router.push(`/dashboard?${params.toString()}`);
  };
  
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
                {isAllStores && ' (across all stores)'}
              </AlertDescription>
            </Alert>
          )}
          {metrics.isPosFiltered && (
            <Alert className="w-auto">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Showing only Point of Sale membership revenues
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Store Selector and Currency Switcher */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Store:</span>
              <Select value={selectedStoreId} onValueChange={handleStoreChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STORES_ID}>All Stores (Combined)</SelectItem>
                  {STORES.map(store => (
                    <SelectItem key={store.storeId} value={store.storeId}>
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {metrics.hasPosFilter && (
              <div className="flex items-center gap-2">
                <Button
                  variant={showPosOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={handlePosFilterToggle}
                >
                  {showPosOnly ? 'POS Memberships Only' : 'All Revenues'}
                </Button>
              </div>
            )}
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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Include VAT in expenses:</span>
          <div className="flex">
            <Button
              variant={!includeVat ? 'default' : 'outline'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setIncludeVat(false)}
            >
              No VAT
            </Button>
            <Button
              variant={includeVat ? 'default' : 'outline'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setIncludeVat(true)}
            >
              With {(SLOVAK_VAT_RATE * 100).toFixed(0)}% VAT
            </Button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground ml-2 cursor-help underline decoration-dotted">
                  (Monthly expenses: {formatCurrency(includeVat ? metrics.expenses.monthlyWithVat : metrics.expenses.monthlyNoVat, 'EUR')})
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <pre className="text-xs whitespace-pre-wrap">{formatExpenseBreakdown(includeVat)}</pre>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-8">
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics.mrr)}
          description={`Current month (${displayCurrency})`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={metrics.growthRate > 0 ? 'up' : metrics.growthRate < 0 ? 'down' : 'neutral'}
          trendValue={formatPercentage(metrics.growthRate)}
        />
        
        <MetricCard
          title="Invoices"
          value={metrics.totalInvoices.toString()}
          description={`${metrics.settledInvoices} settled`}
          icon={<Receipt className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Avg Transaction"
          value={formatCurrency(metrics.medianTransactionValue)}
          description={`Median value`}
          icon={<CreditCard className="h-4 w-4" />}
          trend={metrics.outlierInfo?.hasLargeTransactions ? 'neutral' : undefined}
          trendValue={metrics.outlierInfo?.hasLargeTransactions ? `Max: ${formatCurrency(metrics.outlierInfo.largestTransaction)}` : undefined}
        />
        
        <MetricCard
          title="Conversion"
          value={`${((metrics.settledInvoices / metrics.totalInvoices) * 100).toFixed(1)}%`}
          description="Settled rate"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Profit/Loss"
          value={formatCurrency(includeVat ? metrics.expenses.profitWithVat : metrics.expenses.profitNoVat)}
          description={includeVat ? 'With VAT' : 'Without VAT'}
          icon={<DollarSign className="h-4 w-4" />}
          trend={(includeVat ? metrics.expenses.profitWithVat : metrics.expenses.profitNoVat) > 0 ? 'up' : 'down'}
          trendValue={(includeVat ? metrics.expenses.profitWithVat : metrics.expenses.profitNoVat) > 0 ? 'Profit' : 'Loss'}
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
              monthlyExpenses={includeVat ? metrics.expenses.monthlyWithVat : metrics.expenses.monthlyNoVat}
              includeVat={includeVat}
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
          
          {isAllStores && metrics.storeInfo?.stores && (
            <Card>
              <CardHeader>
                <CardTitle>Store Breakdown</CardTitle>
                <CardDescription>Performance by individual store</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.storeInfo.stores.map((store: any) => (
                    <div key={store.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <span className="font-medium">{store.name}</span>
                      </div>
                      <div className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const storeData = STORES.find(s => s.label === store.name);
                            if (storeData) {
                              handleStoreChange(storeData.storeId);
                            }
                          }}
                        >
                          View Details
                        </Button>
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