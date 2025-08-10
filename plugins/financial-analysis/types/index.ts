export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DashboardMetrics {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  mrr: number;
  growthRate: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  statusBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  topProducts: Array<{ product: string; count: number }>;
  avgTransactionValue: number;
  medianTransactionValue: number;
  totalInvoices: number;
  settledInvoices: number;
  primaryCurrency: string;
  currencyStats: Array<{
    currency: string;
    count: number;
    total: number;
    average: number;
  }>;
  revenueByCurrency: {
    current: Record<string, number>;
    last: Record<string, number>;
  };
  outlierInfo: {
    hasLargeTransactions: boolean;
    largestTransaction: number;
    hasMixedCurrencies: boolean;
    currencyBreakdown: Record<string, number>;
  };
  expenses: {
    monthlyNoVat: number;
    monthlyWithVat: number;
    profitNoVat: number;
    profitWithVat: number;
  };
  storeInfo: any;
  exchangeRate: { eur: number; usd: number } | null;
  isUsingMockData: boolean;
  isAllStores: boolean;
  isPosFiltered: boolean;
  hasPosFilter?: boolean;
}

export interface RevenueProjection {
  historical: Array<{ period: string; revenue: number }>;
  projections: Array<{ period: string; revenue: number; isProjection: boolean }>;
  trend: 'up' | 'down' | 'stable';
  primaryCurrency: string;
  timeFrame: TimeFrame;
  exchangeRate: { eur: number; usd: number } | null;
}