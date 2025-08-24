"use client";

import { Alert, AlertDescription } from "@bps-companion/components/ui/alert";
import { Button } from "@bps-companion/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bps-companion/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bps-companion/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@bps-companion/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bps-companion/components/ui/tooltip";
import { useExpenses } from "@bps-companion/contexts/expenses-context";
import { usePlugins } from "@bps-companion/contexts/plugins-context";
import {
  CreditCard,
  DollarSign,
  Filter,
  InfoIcon,
  Package,
  Receipt,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FinancialAnalysisLoadingSkeleton } from "./components/LoadingSkeleton";
import { MetricCard } from "./components/metric-card";
import { PaymentMethodChart } from "./components/payment-method-chart";
import { ProjectionChart } from "./components/projection-chart";
import { StatusBreakdown } from "./components/status-breakdown";
import { TopProducts } from "./components/top-products";
import { useStores } from "./contexts/stores-context";
import { ALL_STORES_ID } from "./lib/stores";
import manifest from "./manifest.json";
import {
  getDashboardMetrics,
  getRevenueProjection,
} from "./services/dashboard-api";
import type { DashboardMetrics, TimeFrame } from "./types";

export default function FinancialAnalysisClient() {
  const _searchParams = useSearchParams();
  const { isPluginEnabled } = usePlugins();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [projections, setProjections] = useState<any>(null);
  const [loadingProjections, setLoadingProjections] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<"EUR" | "BTC">("EUR");
  const [includeVat, setIncludeVat] = useState(false);
  const NO_FILTER = "no-filter";
  const [selectedFilterId, setSelectedFilterId] = useState<string>(NO_FILTER);
  const _router = useRouter();
  const { getExpenseBreakdown, defaultVatRate, calculateTotalMonthlyExpenses } =
    useExpenses();
  const {
    stores,
    selectedStoreId,
    setSelectedStoreId,
    getStoreSelectOptions,
    isLoading: storesLoading,
  } = useStores();

  const currentStoreId = useMemo(
    () => selectedStoreId || ALL_STORES_ID,
    [selectedStoreId],
  );

  const isAllStores = useMemo(
    () => currentStoreId === ALL_STORES_ID,
    [currentStoreId],
  );

  const currentStore = useMemo(
    () => stores.find((s) => s.storeId === currentStoreId),
    [stores, currentStoreId],
  );

  const currentFilter = useMemo(
    () =>
      selectedFilterId !== NO_FILTER
        ? currentStore?.posFilters?.find((f) => f.id === selectedFilterId)
        : null,
    [selectedFilterId, currentStore],
  );

  const btcRate = metrics?.exchangeRate?.eur || 95000;

  // Memoized expense breakdown formatter
  const formatExpenseBreakdown = useCallback(
    (includeVat: boolean): string => {
      const breakdown = getExpenseBreakdown(includeVat);
      const lines = Object.entries(breakdown).map(
        ([name, amount]) => `${name}: €${amount.toFixed(2)}`,
      );

      const total = calculateTotalMonthlyExpenses(includeVat);
      lines.push("─────────────");
      lines.push(`Total: €${total.toFixed(2)}`);

      if (includeVat && defaultVatRate !== undefined) {
        lines.push(`(incl. ${(defaultVatRate * 100).toFixed(0)}% VAT)`);
      }

      return lines.join("\n");
    },
    [getExpenseBreakdown, calculateTotalMonthlyExpenses, defaultVatRate],
  );

  // Load metrics
  useEffect(() => {
    async function loadMetrics() {
      if (storesLoading) return;
      setLoading(true);
      try {
        const data = await getDashboardMetrics(
          isAllStores ? undefined : currentStoreId,
          false,
          currentFilter?.filter,
        );
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load metrics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [currentStoreId, isAllStores, currentFilter?.filter, storesLoading]);

  const loadProjections = useCallback(
    async (timeFrame: TimeFrame) => {
      setLoadingProjections(true);
      try {
        const data = await getRevenueProjection(
          timeFrame,
          isAllStores ? undefined : currentStoreId,
          isAllStores,
          currentFilter?.filter,
        );
        setProjections(data);
      } catch (error) {
        console.error("Failed to load projections:", error);
      } finally {
        setLoadingProjections(false);
      }
    },
    [currentStoreId, isAllStores, currentFilter?.filter],
  );

  // Load initial projections
  useEffect(() => {
    loadProjections("monthly");
  }, [loadProjections]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
  };

  // Memoized currency conversion function
  const convertValue = useCallback(
    (value: number, fromCurrency?: string) => {
      const sourceCurrency = fromCurrency || metrics?.primaryCurrency || "EUR";

      if (displayCurrency === "BTC") {
        if (sourceCurrency === "EUR") {
          return value / btcRate;
        }
        if (sourceCurrency === "SATS" || sourceCurrency === "sats") {
          return value / 100000000; // 1 BTC = 100M SATS
        }
        if (sourceCurrency === "USD") {
          // Convert USD to BTC using USD rate
          const usdRate = metrics?.exchangeRate?.usd || 100000;
          return value / usdRate;
        }
      } else if (displayCurrency === "EUR") {
        if (sourceCurrency === "SATS" || sourceCurrency === "sats") {
          return (value / 100000000) * btcRate;
        }
        if (sourceCurrency === "USD") {
          // Convert USD to EUR via BTC
          const usdRate = metrics?.exchangeRate?.usd || 100000;
          return (value / usdRate) * btcRate;
        }
      }

      return value;
    },
    [
      displayCurrency,
      btcRate,
      metrics?.primaryCurrency,
      metrics?.exchangeRate?.usd,
    ],
  );

  const formatCurrency = useCallback(
    (amount: number, currency?: string) => {
      const cur = currency || metrics?.primaryCurrency || "EUR";
      const convertedAmount = convertValue(amount, cur);

      if (displayCurrency === "BTC") {
        return `₿${convertedAmount.toFixed(4)}`;
      }

      // Handle SATS (satoshis) - custom format
      if (cur === "SATS" || cur === "Sats" || cur === "sats") {
        if (displayCurrency === "EUR") {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "EUR",
          }).format(convertedAmount);
        }
        return `${amount.toLocaleString()} SATS`;
      }

      // Handle standard currency codes
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: displayCurrency,
        }).format(convertedAmount);
      } catch (_error) {
        // Fallback for any other non-standard currency codes
        return `${convertedAmount.toLocaleString()} ${displayCurrency}`;
      }
    },
    [convertValue, displayCurrency, metrics?.primaryCurrency],
  );

  const formatPercentage = useCallback((value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  }, []);

  // Check if plugin is enabled
  if (!isPluginEnabled("financial-analysis")) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Financial Analysis</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground mb-4">
              The Financial Analysis app is currently disabled.
            </p>
            <div className="text-center">
              <Link href="/apps">
                <Button>Go to Apps</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading states
  if (loading || storesLoading || !metrics) {
    return <FinancialAnalysisLoadingSkeleton />;
  }

  // Handle no stores configured
  if (!storesLoading && stores.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Financial Analysis</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Stores Configured</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Configure your BTCPay stores to start tracking financial data and
              analyzing revenue.
            </p>
            <Link href="/apps/financial-analysis/settings">
              <Button>
                <Settings className="mr-2 h-4 w-4" />
                Configure Stores
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Analysis</h1>
          <p className="text-muted-foreground mt-1">
            {metrics.storeInfo?.name || "BTCPay Store"} Analytics
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
                Multiple currencies detected. Showing {metrics.primaryCurrency}{" "}
                metrics.
                {isAllStores && " (across all stores)"}
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
              <Select value={currentStoreId} onValueChange={handleStoreChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStoreSelectOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentStore?.posFilters && currentStore.posFilters.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select
                  value={selectedFilterId}
                  onValueChange={setSelectedFilterId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_FILTER}>
                      <span className="flex items-center gap-2">
                        All Transactions
                      </span>
                    </SelectItem>
                    {currentStore.posFilters.map((filter) => (
                      <SelectItem key={filter.id} value={filter.id}>
                        <span className="flex items-center gap-2">
                          <Filter className="h-3 w-3" />
                          {filter.name}
                          {filter.description && (
                            <span className="text-xs text-muted-foreground">
                              ({filter.filter})
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Display currency:
              </span>
              <div className="flex">
                <Button
                  variant={displayCurrency === "EUR" ? "default" : "outline"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setDisplayCurrency("EUR")}
                >
                  € EUR
                </Button>
                <Button
                  variant={displayCurrency === "BTC" ? "default" : "outline"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setDisplayCurrency("BTC")}
                >
                  ₿ BTC
                </Button>
              </div>
              {displayCurrency === "BTC" && (
                <span className="text-sm text-muted-foreground ml-2">
                  (1 BTC = €{btcRate.toLocaleString()})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Include VAT in expenses:
          </span>
          <div className="flex">
            <Button
              variant={!includeVat ? "default" : "outline"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setIncludeVat(false)}
            >
              No VAT
            </Button>
            <Button
              variant={includeVat ? "default" : "outline"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setIncludeVat(true)}
              disabled={defaultVatRate === undefined}
            >
              {defaultVatRate !== undefined
                ? `With ${(defaultVatRate * 100).toFixed(0)}% VAT`
                : "With VAT"}
            </Button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground ml-2 cursor-help underline decoration-dotted">
                  (Monthly expenses:{" "}
                  {formatCurrency(
                    includeVat
                      ? metrics.expenses.monthlyWithVat
                      : metrics.expenses.monthlyNoVat,
                    "EUR",
                  )}
                  )
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <pre className="text-xs whitespace-pre-wrap">
                  {formatExpenseBreakdown(includeVat)}
                </pre>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* VAT Configuration Alert */}
      {defaultVatRate === undefined && (
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            VAT rate is not configured. To include VAT in expense calculations,
            please{" "}
            <Link
              href={`/apps/${manifest.id}/settings`}
              className="underline font-medium"
            >
              configure it in settings
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-8">
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics.mrr)}
          description={`Current month (${displayCurrency})`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={
            metrics.growthRate > 0
              ? "up"
              : metrics.growthRate < 0
                ? "down"
                : "neutral"
          }
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
          description={"Median value"}
          icon={<CreditCard className="h-4 w-4" />}
          trend={
            metrics.outlierInfo?.hasLargeTransactions ? "neutral" : undefined
          }
          trendValue={
            metrics.outlierInfo?.hasLargeTransactions
              ? `Max: ${formatCurrency(metrics.outlierInfo.largestTransaction)}`
              : undefined
          }
        />

        <MetricCard
          title="Conversion"
          value={`${((metrics.settledInvoices / metrics.totalInvoices) * 100).toFixed(1)}%`}
          description="Settled rate"
          icon={<TrendingUp className="h-4 w-4" />}
        />

        <MetricCard
          title="Profit/Loss"
          value={formatCurrency(
            includeVat
              ? metrics.expenses.profitWithVat
              : metrics.expenses.profitNoVat,
          )}
          description={includeVat ? "With VAT" : "Without VAT"}
          icon={<DollarSign className="h-4 w-4" />}
          trend={
            (includeVat
              ? metrics.expenses.profitWithVat
              : metrics.expenses.profitNoVat) > 0
              ? "up"
              : "down"
          }
          trendValue={
            (includeVat
              ? metrics.expenses.profitWithVat
              : metrics.expenses.profitNoVat) > 0
              ? "Profit"
              : "Loss"
          }
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
            <ProjectionChart
              data={projections}
              onTimeFrameChange={loadProjections}
              displayCurrency={displayCurrency}
              monthlyExpenses={
                includeVat
                  ? metrics.expenses.monthlyWithVat
                  : metrics.expenses.monthlyNoVat
              }
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
                    <div
                      key={stat.currency}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">{stat.currency}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({stat.count} invoices)
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(stat.total, stat.currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(stat.average, stat.currency)}
                        </div>
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
                <CardDescription>
                  Performance by individual store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.storeInfo.stores.map((store: any) => (
                    <div
                      key={store.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">{store.name}</span>
                      </div>
                      <div className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const storeData = stores.find(
                              (s) => s.storeName === store.name,
                            );
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
              <CardDescription>
                Best selling items by invoice count
              </CardDescription>
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
