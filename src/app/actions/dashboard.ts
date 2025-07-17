'use server';

import { BTCPayClient } from '@/services/btcpay-client';
import { BTCPayMockClient } from '@/services/btcpay-mock';
import { serverEnv, clientEnv } from '@/lib/env';
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns';

const getClient = () => {
  const isUsingMock = !serverEnv.btcpayApiKey || clientEnv.useMock;
  
  if (isUsingMock) {
    return new BTCPayMockClient({
      serverUrl: clientEnv.btcpayUrl,
      apiKey: 'mock-api-key',
      storeId: clientEnv.storeId,
    });
  }

  console.log('Dashboard Client Configuration:', {
    serverUrl: clientEnv.btcpayUrl,
    hasApiKey: !!serverEnv.btcpayApiKey,
    apiKeyLength: serverEnv.btcpayApiKey.length,
    storeId: clientEnv.storeId,
  });

  return new BTCPayClient({
    serverUrl: clientEnv.btcpayUrl,
    apiKey: serverEnv.btcpayApiKey,
    storeId: clientEnv.storeId,
  });
};

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
    return [];
  }
}

export async function getStoreInfo() {
  const client = getClient();
  try {
    return await client.getStoreInfo();
  } catch (error) {
    console.error('Failed to get store info:', error);
    return null;
  }
}

export async function getPaymentMethods() {
  const client = getClient();
  try {
    return await client.getPaymentMethods();
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    return [];
  }
}

export async function getDashboardMetrics() {
  const client = getClient();
  
  try {
    // Get invoices for the last 6 months and BTC exchange rate
    const sixMonthsAgo = subMonths(new Date(), 6);
    const [invoices, exchangeRate] = await Promise.all([
      client.getInvoices({
        startDate: sixMonthsAgo.toISOString(),
        take: 1000, // Get more invoices for better analytics
      }),
      getBTCExchangeRate()
    ]);

    // Calculate metrics
    const metrics = calculateMetrics(invoices);
    
    // Get store info
    const storeInfo = await client.getStoreInfo();
    
    return {
      ...metrics,
      storeInfo,
      exchangeRate,
      isUsingMockData: !serverEnv.btcpayApiKey || clientEnv.useMock,
    };
  } catch (error) {
    console.error('Failed to get dashboard metrics:', error);
    return null;
  }
}

function calculateMetrics(invoices: any[]) {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));
  
  // Filter settled invoices that have actually been paid
  const settledInvoices = invoices.filter(inv => {
    if (inv.status !== 'Settled') return false;
    
    // Check if invoice has been paid
    const paidAmount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    return paidAmount > 0;
  });
  
  // Debug: Log sample invoice to check structure
  if (settledInvoices.length > 0) {
    console.log('Sample settled invoice:', {
      amount: settledInvoices[0].amount,
      paidAmount: settledInvoices[0].paidAmount,
      currency: settledInvoices[0].currency,
      metadata: settledInvoices[0].metadata,
    });
  }
  
  // First, calculate currency breakdown to determine primary currency
  const currencyBreakdown = settledInvoices.reduce((acc, inv) => {
    const currency = inv.currency || 'EUR';
    acc[currency] = (acc[currency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // For simplicity, we'll use the primary currency (most common one)
  const primaryCurrency = Object.entries(currencyBreakdown)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'EUR';
  
  // Calculate current month revenue
  const currentMonthInvoices = settledInvoices.filter(inv => {
    // Handle Unix timestamp (seconds since epoch)
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
    
    // Use primary currency for this month
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
  
  // Calculate payment method breakdown (for settled invoices)
  const paymentMethodBreakdown = settledInvoices.reduce((acc, inv) => {
    // BTCPay API might have different structure for payment methods
    const method = inv.checkout?.defaultPaymentMethod || 
                   inv.checkout?.paymentMethods?.[0] || 
                   'Unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate top products
  const productCounts = settledInvoices.reduce((acc, inv) => {
    // Try different metadata fields where product info might be stored
    const product = inv.metadata?.itemDesc || 
                   inv.metadata?.orderId || 
                   'Unknown Product';
    acc[product] = (acc[product] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([product, count]) => ({ product, count }));
  
  // Calculate average transaction value per currency
  const paidInvoicesByCurrency = settledInvoices.reduce((acc, inv) => {
    const currency = inv.currency || 'USD';
    if (!acc[currency]) acc[currency] = [];
    acc[currency].push(inv);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Calculate metrics for primary currency
  const primaryCurrencyInvoices = paidInvoicesByCurrency[primaryCurrency] || [];
  const totalRevenue = primaryCurrencyInvoices.reduce((sum, inv) => {
    const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    return sum + amount;
  }, 0);
  
  const avgTransactionValue = primaryCurrencyInvoices.length > 0
    ? totalRevenue / primaryCurrencyInvoices.length
    : 0;
    
  // Find min, max, and check for outliers (for primary currency)
  const amounts = primaryCurrencyInvoices.map(inv => {
    const paidAmount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
    return paidAmount;
  }).filter(a => a > 0);
  
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const median = sortedAmounts.length > 0 
    ? sortedAmounts[Math.floor(sortedAmounts.length / 2)]
    : 0;
  
  // Show currency breakdown
  const currencyStats = Object.entries(paidInvoicesByCurrency).map(([currency, invoices]) => {
    const total = invoices.reduce((sum, inv) => {
      const amount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount;
      return sum + amount;
    }, 0);
    const avg = total / invoices.length;
    return { currency, count: invoices.length, total, average: avg };
  });
  
  console.log('Transaction analysis:', {
    totalInvoices: invoices.length,
    settledCount: settledInvoices.length,
    primaryCurrency,
    currencyStats,
    primaryCurrencyMetrics: {
      count: primaryCurrencyInvoices.length,
      totalRevenue: totalRevenue.toFixed(2),
      avgValue: avgTransactionValue.toFixed(2),
      median: median.toFixed(2),
      min: amounts.length > 0 ? Math.min(...amounts).toFixed(2) : '0',
      max: amounts.length > 0 ? Math.max(...amounts).toFixed(2) : '0',
    },
    sampleInvoices: primaryCurrencyInvoices.slice(0, 3).map(inv => ({
      id: inv.id,
      amount: inv.amount,
      paidAmount: inv.paidAmount,
      currency: inv.currency,
      createdTime: new Date(inv.createdTime * 1000).toISOString(),
      metadata: inv.metadata?.itemDesc || inv.metadata?.orderId
    }))
  });
  
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
  };
}

export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export async function getBTCExchangeRate(): Promise<{ eur: number; usd: number } | null> {
  try {
    // Using CoinGecko's free API (no key required)
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd');
    if (!response.ok) {
      throw new Error('Failed to fetch BTC price');
    }
    const data = await response.json();
    return {
      eur: data.bitcoin.eur,
      usd: data.bitcoin.usd,
    };
  } catch (error) {
    console.error('Failed to fetch BTC exchange rate:', error);
    // Fallback to approximate rates if API fails
    return {
      eur: 95000, // Approximate fallback
      usd: 100000, // Approximate fallback
    };
  }
}

export async function getRevenueData(timeFrame: TimeFrame = 'monthly') {
  const client = getClient();
  
  try {
    // Determine date range based on timeframe
    const now = new Date();
    const startDate = new Date('2022-01-01'); // Maximum historical data from 2022
    
    const invoices = await client.getInvoices({
      startDate: startDate.toISOString(),
      take: 5000, // Get more invoices for detailed analysis
    });
    
    // Filter and group data based on timeframe
    const groupedData = groupInvoicesByTimeFrame(invoices, timeFrame);
    
    return groupedData;
  } catch (error) {
    console.error('Failed to get revenue data:', error);
    return null;
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
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'EUR';
  
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

export async function getRevenueProjection(timeFrame: TimeFrame = 'monthly') {
  const [revenueData, exchangeRate] = await Promise.all([
    getRevenueData(timeFrame),
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
  if (n < 2) return null; // Need at least 2 points for regression
  
  const sumX = regressionData.reduce((sum, item) => sum + item.x, 0);
  const sumY = regressionData.reduce((sum, item) => sum + item.y, 0);
  const sumXY = regressionData.reduce((sum, item) => sum + item.x * item.y, 0);
  const sumX2 = regressionData.reduce((sum, item) => sum + item.x * item.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate projections based on timeframe
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

function getProjectionCount(timeFrame: TimeFrame): number {
  switch (timeFrame) {
    case 'daily': return 30; // 30 days
    case 'weekly': return 12; // 12 weeks
    case 'monthly': return 6; // 6 months
    case 'quarterly': return 4; // 4 quarters
    case 'yearly': return 2; // 2 years
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