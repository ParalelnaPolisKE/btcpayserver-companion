'use client';

import { BTCPayClient } from '@/services/btcpay-client';
import { BTCPayMockClient } from '@/services/btcpay-mock';
import { clientEnv } from '@/lib/env';
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns';
import { calculateTotalMonthlyExpenses } from '@/lib/expenses';
import { STORES } from '@/lib/stores';
import type { TimeFrame } from '@/types/dashboard';

// Simple in-memory cache for BTC price
let btcPriceCache: {
  data: { eur: number; usd: number } | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Get client instance - for client-side, we'll need the API key from localStorage or env
const getClient = (storeId?: string) => {
  // In a Tauri app, you might want to store the API key securely
  // For now, we'll use the public env variable or localStorage
  const apiKey = typeof window !== 'undefined' 
    ? localStorage.getItem('btcpay_api_key') || process.env.NEXT_PUBLIC_BTCPAY_API_KEY || ''
    : process.env.NEXT_PUBLIC_BTCPAY_API_KEY || '';
    
  const isUsingMock = !apiKey || clientEnv.useMock;
  const finalStoreId = storeId || clientEnv.storeId;
  
  if (isUsingMock) {
    return new BTCPayMockClient({
      serverUrl: clientEnv.btcpayUrl,
      apiKey: 'mock-api-key',
      storeId: finalStoreId,
    });
  }

  return new BTCPayClient({
    serverUrl: clientEnv.btcpayUrl,
    apiKey: apiKey,
    storeId: finalStoreId,
  });
};

// Helper function to filter invoices from Point of Sale memberships
function filterPosInvoices(invoices: any[], posFilterString: string) {
  return invoices.filter(invoice => {
    const orderUrl = invoice.metadata?.orderUrl || '';
    return orderUrl.includes(posFilterString);
  });
}

export async function getBTCExchangeRate(): Promise<{ eur: number; usd: number } | null> {
  // Check if we have cached data that's still valid
  if (btcPriceCache && Date.now() - btcPriceCache.timestamp < CACHE_DURATION) {
    console.log('Using cached BTC price');
    return btcPriceCache.data;
  }

  console.log('Fetching fresh BTC price');
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd');
    if (!response.ok) {
      throw new Error('Failed to fetch BTC price');
    }
    const data = await response.json();
    
    const exchangeRate = {
      eur: data.bitcoin.eur,
      usd: data.bitcoin.usd,
    };
    
    // Update cache
    btcPriceCache = {
      data: exchangeRate,
      timestamp: Date.now(),
    };
    
    return exchangeRate;
  } catch (error) {
    console.error('Failed to fetch BTC exchange rate:', error);
    
    // If we have stale cached data, use it as fallback
    if (btcPriceCache?.data) {
      console.log('Using stale cached BTC price as fallback');
      return btcPriceCache.data;
    }
    
    // Ultimate fallback to approximate rates
    return {
      eur: 95000,
      usd: 100000,
    };
  }
}

function calculateMetrics(invoices: any[]) {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));
  
  // Filter settled invoices that have actually been paid
  const settledInvoices = invoices.filter(inv => {
    if (inv.status !== 'Settled') return false;
    const paidAmount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    return paidAmount > 0;
  });
  
  // First, calculate currency breakdown to determine primary currency
  const currencyBreakdown = settledInvoices.reduce((acc, inv) => {
    const currency = inv.currency || 'EUR';
    acc[currency] = (acc[currency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const primaryCurrency = Object.entries(currencyBreakdown)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'EUR';
  
  // Calculate current month revenue
  const currentMonthInvoices = settledInvoices.filter(inv => {
    const created = new Date(inv.createdTime * 1000);
    return created >= currentMonth;
  });
  
  // Group revenue by currency
  const currentMonthRevenueByCurrency = currentMonthInvoices.reduce((acc, inv) => {
    const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    const currency = inv.currency || 'EUR';
    acc[currency] = (acc[currency] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate last month revenue
  const lastMonthInvoices = settledInvoices.filter(inv => {
    const created = new Date(inv.createdTime * 1000);
    return created >= lastMonth && created < currentMonth;
  });
  
  const lastMonthRevenueByCurrency = lastMonthInvoices.reduce((acc, inv) => {
    const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    const currency = inv.currency || 'EUR';
    acc[currency] = (acc[currency] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
  
  const currentMonthRevenue = currentMonthRevenueByCurrency[primaryCurrency] || 0;
  const lastMonthRevenue = lastMonthRevenueByCurrency[primaryCurrency] || 0;
  
  // Calculate MRR (simplified - assuming all revenue is recurring)
  const mrr = currentMonthRevenue;
  
  // Calculate growth rate
  const growthRate = lastMonthRevenue > 0 
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;
  
  // Calculate revenue by month for the last 6 months
  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    
    const monthInvoices = settledInvoices.filter(inv => {
      const created = new Date(inv.createdTime * 1000);
      return created >= monthStart && created <= monthEnd;
    });
    
    const monthRevenueByCurrency = monthInvoices.reduce((acc, inv) => {
      const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
      const currency = inv.currency || 'USD';
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
    
    const monthRevenue = monthRevenueByCurrency[primaryCurrency] || 0;
    
    revenueByMonth.push({
      month: format(monthStart, 'MMM yyyy'),
      revenue: monthRevenue,
    });
  }
  
  // Calculate status breakdown
  const statusBreakdown = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate payment method breakdown
  const paymentMethodBreakdown = settledInvoices.reduce((acc, inv) => {
    const method = inv.checkout?.defaultPaymentMethod || 
                   inv.checkout?.paymentMethods?.[0] || 
                   'Unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate top products
  const productCounts = settledInvoices.reduce((acc, inv) => {
    const product = inv.metadata?.itemDesc || 
                   inv.metadata?.orderId || 
                   'Unknown Product';
    acc[product] = (acc[product] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([product, count]) => ({ product, count: count as number }));
  
  // Calculate average transaction value
  const paidInvoicesByCurrency = settledInvoices.reduce((acc: Record<string, any[]>, inv: any) => {
    const currency = inv.currency || 'USD';
    if (!acc[currency]) acc[currency] = [];
    acc[currency].push(inv);
    return acc;
  }, {} as Record<string, any[]>);
  
  const primaryCurrencyInvoices = paidInvoicesByCurrency[primaryCurrency] || [];
  const totalRevenue = primaryCurrencyInvoices.reduce((sum: number, inv: any) => {
    const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    return sum + amount;
  }, 0);
  
  const avgTransactionValue = primaryCurrencyInvoices.length > 0
    ? totalRevenue / primaryCurrencyInvoices.length
    : 0;
    
  const amounts = primaryCurrencyInvoices.map((inv: any) => {
    const paidAmount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    return paidAmount;
  }).filter((a: number) => a > 0);
  
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const median = sortedAmounts.length > 0 
    ? sortedAmounts[Math.floor(sortedAmounts.length / 2)]
    : 0;
  
  const currencyStats = Object.entries(paidInvoicesByCurrency).map(([currency, invoices]) => {
    const total = (invoices as any[]).reduce((sum: number, inv: any) => {
      const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
      return sum + amount;
    }, 0);
    const avg = total / (invoices as any[]).length;
    return { currency, count: (invoices as any[]).length, total, average: avg };
  });
  
  // Calculate profit/loss based on monthly expenses
  const monthlyExpensesNoVat = calculateTotalMonthlyExpenses(false);
  const monthlyExpensesWithVat = calculateTotalMonthlyExpenses(true);
  const profitNoVat = currentMonthRevenue - monthlyExpensesNoVat;
  const profitWithVat = currentMonthRevenue - monthlyExpensesWithVat;
  
  return {
    currentMonthRevenue,
    lastMonthRevenue,
    mrr,
    growthRate,
    revenueByMonth,
    statusBreakdown,
    paymentMethodBreakdown,
    topProducts,
    avgTransactionValue,
    medianTransactionValue: median,
    totalInvoices: invoices.length,
    settledInvoices: settledInvoices.length,
    primaryCurrency,
    currencyStats,
    revenueByCurrency: {
      current: currentMonthRevenueByCurrency,
      last: lastMonthRevenueByCurrency,
    },
    outlierInfo: {
      hasLargeTransactions: amounts.length > 0 && Math.max(...amounts) > 1000,
      largestTransaction: amounts.length > 0 ? Math.max(...amounts) : 0,
      hasMixedCurrencies: Object.keys(currencyBreakdown).length > 1,
      currencyBreakdown,
    },
    expenses: {
      monthlyNoVat: monthlyExpensesNoVat,
      monthlyWithVat: monthlyExpensesWithVat,
      profitNoVat,
      profitWithVat,
    },
  };
}

export async function getDashboardMetrics(storeId?: string, allStores?: boolean, showPosOnly?: boolean) {
  try {
    const exchangeRate = await getBTCExchangeRate();
    
    if (allStores) {
      // Fetch data from all stores in parallel
      const allStoreData = await Promise.all(
        STORES.map(async (store) => {
          const client = getClient(store.storeId);
          const sixMonthsAgo = subMonths(new Date(), 6);
          
          try {
            const [invoices, storeInfo] = await Promise.all([
              client.getInvoices({
                startDate: sixMonthsAgo.toISOString(),
                take: 1000,
              }),
              client.getStoreInfo()
            ]);
            
            // Apply POS filter if needed for specific stores
            let filteredInvoices = invoices;
            if (showPosOnly && store.posFilter) {
              filteredInvoices = filterPosInvoices(invoices, store.posFilter);
            }
            
            return { invoices: filteredInvoices, storeInfo, storeName: store.label };
          } catch (error) {
            console.error(`Failed to get data for store ${store.label}:`, error);
            return { invoices: [], storeInfo: null, storeName: store.label };
          }
        })
      );
      
      // Combine all invoices
      const allInvoices = allStoreData.flatMap(data => data.invoices);
      const metrics = calculateMetrics(allInvoices);
      
      // Create aggregated store info
      const storeInfo = {
        name: 'All Stores',
        website: '',
        invoiceExpiration: 900,
        monitoringExpiration: 3600,
        speedPolicy: 'MediumSpeed',
        stores: allStoreData.map(d => ({ name: d.storeName, info: d.storeInfo }))
      };
      
      const apiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('btcpay_api_key') || process.env.NEXT_PUBLIC_BTCPAY_API_KEY || ''
        : process.env.NEXT_PUBLIC_BTCPAY_API_KEY || '';
      
      return {
        ...metrics,
        storeInfo,
        exchangeRate,
        isUsingMockData: !apiKey || clientEnv.useMock,
        isAllStores: true,
        isPosFiltered: showPosOnly || false,
        hasPosFilter: false,
      };
    } else {
      // Single store
      const client = getClient(storeId);
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      let [invoices, storeInfo] = await Promise.all([
        client.getInvoices({
          startDate: sixMonthsAgo.toISOString(),
          take: 1000,
        }),
        client.getStoreInfo()
      ]);
      
      // Check if this store has POS filter capability
      const storeConfig = STORES.find(s => s.storeId === storeId);
      
      // Apply POS filter if requested and available for this store
      if (showPosOnly && storeConfig?.posFilter) {
        invoices = filterPosInvoices(invoices, storeConfig.posFilter);
      }
      
      const metrics = calculateMetrics(invoices);
      
      const apiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('btcpay_api_key') || process.env.NEXT_PUBLIC_BTCPAY_API_KEY || ''
        : process.env.NEXT_PUBLIC_BTCPAY_API_KEY || '';
      
      return {
        ...metrics,
        storeInfo,
        exchangeRate,
        isUsingMockData: !apiKey || clientEnv.useMock,
        isAllStores: false,
        isPosFiltered: (showPosOnly && !!storeConfig?.posFilter) || false,
        hasPosFilter: !!storeConfig?.posFilter,
      };
    }
  } catch (error) {
    console.error('Failed to get dashboard metrics:', error);
    throw error;
  }
}

function getTimeKey(date: Date, timeFrame: TimeFrame): string {
  switch (timeFrame) {
    case 'daily':
      return format(date, 'yyyy-MM-dd');
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return format(weekStart, 'yyyy-MM-dd');
    case 'monthly':
      return format(date, 'yyyy-MM');
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    case 'yearly':
      return date.getFullYear().toString();
  }
}

function groupInvoicesByTimeFrame(invoices: any[], timeFrame: TimeFrame) {
  const settledInvoices = invoices.filter(inv => {
    if (inv.status !== 'Settled') return false;
    const paidAmount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    return paidAmount > 0;
  });
  
  // Get currency breakdown
  const currencyBreakdown = settledInvoices.reduce((acc, inv) => {
    const currency = inv.currency || 'EUR';
    acc[currency] = (acc[currency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const primaryCurrency = Object.entries(currencyBreakdown)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'EUR';
  
  // Group by time period
  const grouped = new Map<string, number>();
  
  settledInvoices.forEach(inv => {
    const date = new Date(inv.createdTime * 1000);
    const key = getTimeKey(date, timeFrame);
    const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    
    // Only count primary currency for consistency
    if (inv.currency === primaryCurrency) {
      grouped.set(key, (grouped.get(key) || 0) + amount);
    }
  });
  
  // Convert to array and sort
  const data = Array.from(grouped.entries())
    .map(([period, revenue]) => ({ period, revenue }))
    .sort((a, b) => a.period.localeCompare(b.period));
  
  return { data, primaryCurrency, timeFrame };
}

export async function getRevenueData(timeFrame: TimeFrame = 'monthly', storeId?: string, allStores?: boolean, showPosOnly?: boolean) {
  try {
    const now = new Date();
    const startDate = new Date('2022-01-01');
    
    let invoices: any[] = [];
    
    if (allStores) {
      // Fetch from all stores
      const allInvoicesPromises = STORES.map(async (store) => {
        const client = getClient(store.storeId);
        try {
          let storeInvoices = await client.getInvoices({
            startDate: startDate.toISOString(),
            take: 5000,
          });
          
          // Apply POS filter if needed
          if (showPosOnly && store.posFilter) {
            storeInvoices = filterPosInvoices(storeInvoices, store.posFilter);
          }
          
          return storeInvoices;
        } catch (error) {
          console.error(`Failed to get invoices for store ${store.label}:`, error);
          return [];
        }
      });
      
      const allInvoicesArrays = await Promise.all(allInvoicesPromises);
      invoices = allInvoicesArrays.flat();
    } else {
      // Single store
      const client = getClient(storeId);
      invoices = await client.getInvoices({
        startDate: startDate.toISOString(),
        take: 5000,
      });
      
      // Apply POS filter if requested and available
      const storeConfig = STORES.find(s => s.storeId === storeId);
      if (showPosOnly && storeConfig?.posFilter) {
        invoices = filterPosInvoices(invoices, storeConfig.posFilter);
      }
    }
    
    const groupedData = groupInvoicesByTimeFrame(invoices, timeFrame);
    return groupedData;
  } catch (error) {
    console.error('Failed to get revenue data:', error);
    throw error;
  }
}

function getProjectionCount(timeFrame: TimeFrame): number {
  switch (timeFrame) {
    case 'daily': return 30;
    case 'weekly': return 12;
    case 'monthly': return 6;
    case 'quarterly': return 4;
    case 'yearly': return 2;
  }
}

function parseTimeKey(key: string, timeFrame: TimeFrame): Date {
  switch (timeFrame) {
    case 'daily':
    case 'weekly':
    case 'monthly':
      return new Date(key);
    case 'quarterly':
      const [year, quarter] = key.split('-Q');
      const month = (parseInt(quarter) - 1) * 3;
      return new Date(parseInt(year), month, 1);
    case 'yearly':
      return new Date(parseInt(key), 0, 1);
  }
}

function addPeriod(date: Date, count: number, timeFrame: TimeFrame): Date {
  const result = new Date(date);
  switch (timeFrame) {
    case 'daily':
      result.setDate(result.getDate() + count);
      break;
    case 'weekly':
      result.setDate(result.getDate() + count * 7);
      break;
    case 'monthly':
      result.setMonth(result.getMonth() + count);
      break;
    case 'quarterly':
      result.setMonth(result.getMonth() + count * 3);
      break;
    case 'yearly':
      result.setFullYear(result.getFullYear() + count);
      break;
  }
  return result;
}

function formatProjectionDate(date: Date, timeFrame: TimeFrame): string {
  return getTimeKey(date, timeFrame);
}

export async function getRevenueProjection(timeFrame: TimeFrame = 'monthly', storeId?: string, allStores?: boolean, showPosOnly?: boolean) {
  const [revenueData, exchangeRate] = await Promise.all([
    getRevenueData(timeFrame, storeId, allStores, showPosOnly),
    getBTCExchangeRate()
  ]);
  
  if (!revenueData) return null;
  
  const { data, primaryCurrency } = revenueData;
  
  // Simple linear regression for projection
  const regressionData = data.map((item, index) => ({
    x: index,
    y: item.revenue,
  }));
  
  const n = regressionData.length;
  if (n < 2) return null;
  
  const sumX = regressionData.reduce((sum, item) => sum + item.x, 0);
  const sumY = regressionData.reduce((sum, item) => sum + item.y, 0);
  const sumXY = regressionData.reduce((sum, item) => sum + item.x * item.y, 0);
  const sumX2 = regressionData.reduce((sum, item) => sum + item.x * item.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate projections
  const projectionCount = getProjectionCount(timeFrame);
  const projections = [];
  
  const lastDate = parseTimeKey(data[data.length - 1].period, timeFrame);
  
  for (let i = 1; i <= projectionCount; i++) {
    const x = n - 1 + i;
    const projectedRevenue = slope * x + intercept;
    const projectionDate = addPeriod(lastDate, i, timeFrame);
    
    projections.push({
      period: formatProjectionDate(projectionDate, timeFrame),
      revenue: Math.max(0, projectedRevenue),
      isProjection: true,
    });
  }
  
  return {
    historical: data.map(d => ({ period: d.period, revenue: d.revenue })),
    projections,
    trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
    primaryCurrency,
    timeFrame,
    exchangeRate,
  };
}

export async function getInvoices(params?: {
  skip?: number;
  take?: number;
  startDate?: string;
  endDate?: string;
  status?: string[];
  searchTerm?: string;
}) {
  const client = getClient();
  try {
    return await client.getInvoices(params);
  } catch (error) {
    console.error('Failed to get invoices:', error);
    throw error;
  }
}

export async function getStoreInfo() {
  const client = getClient();
  try {
    return await client.getStoreInfo();
  } catch (error) {
    console.error('Failed to get store info:', error);
    throw error;
  }
}

export async function getPaymentMethods() {
  const client = getClient();
  try {
    return await client.getPaymentMethods();
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    throw error;
  }
}