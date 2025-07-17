'use server';

import { BTCPayClient } from '@/services/btcpay-client';
import { BTCPayMockClient } from '@/services/btcpay-mock';
import { serverEnv, clientEnv } from '@/lib/env';
import { startOfMonth, subMonths, endOfMonth, format, parseISO } from 'date-fns';

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
    // Get invoices for the last 6 months
    const sixMonthsAgo = subMonths(new Date(), 6);
    const invoices = await client.getInvoices({
      startDate: sixMonthsAgo.toISOString(),
      take: 1000, // Get more invoices for better analytics
    });

    // Calculate metrics
    const metrics = calculateMetrics(invoices);
    
    // Get store info
    const storeInfo = await client.getStoreInfo();
    
    return {
      ...metrics,
      storeInfo,
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
  
  // Filter settled invoices (BTCPay uses capitalized status)
  const settledInvoices = invoices.filter(inv => inv.status === 'Settled');
  
  // Debug: Log sample invoice to check structure
  if (settledInvoices.length > 0) {
    console.log('Sample settled invoice:', {
      amount: settledInvoices[0].amount,
      paidAmount: settledInvoices[0].paidAmount,
      currency: settledInvoices[0].currency,
      metadata: settledInvoices[0].metadata,
    });
  }
  
  // Calculate current month revenue
  const currentMonthInvoices = settledInvoices.filter(inv => {
    // Handle Unix timestamp (seconds since epoch)
    const created = new Date(inv.createdTime * 1000);
    return created >= currentMonth;
  });
  
  const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => {
    const paidAmount = inv.paidAmount || inv.amount;
    const amount = typeof paidAmount === 'string' ? parseFloat(paidAmount) : paidAmount;
    return sum + (amount || 0);
  }, 0);
  
  // Calculate last month revenue
  const lastMonthInvoices = settledInvoices.filter(inv => {
    const created = new Date(inv.createdTime * 1000);
    return created >= lastMonth && created < currentMonth;
  });
  
  const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => {
    const paidAmount = inv.paidAmount || inv.amount;
    const amount = typeof paidAmount === 'string' ? parseFloat(paidAmount) : paidAmount;
    return sum + (amount || 0);
  }, 0);
  
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
    
    const monthRevenue = monthInvoices.reduce((sum, inv) => {
      const paidAmount = inv.paidAmount || inv.amount;
      const amount = typeof paidAmount === 'string' ? parseFloat(paidAmount) : paidAmount;
      return sum + (amount || 0);
    }, 0);
    
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
    const method = inv.checkout?.paymentMethods?.[0] || 
                   inv.paymentMethod || 
                   inv.paymentMethodId ||
                   'Unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate top products
  const productCounts = settledInvoices.reduce((acc, inv) => {
    // Try different metadata fields where product info might be stored
    const product = inv.metadata?.itemDesc || 
                   inv.metadata?.orderId || 
                   inv.metadata?.itemCode || 
                   inv.metadata?.physical?.name ||
                   'Unknown Product';
    acc[product] = (acc[product] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([product, count]) => ({ product, count }));
  
  // Calculate average transaction value
  // Use paidAmount if available, otherwise fall back to amount
  const avgTransactionValue = settledInvoices.length > 0
    ? settledInvoices.reduce((sum, inv) => {
        // BTCPay returns paidAmount for what was actually paid
        const paidAmount = inv.paidAmount || inv.amount;
        const amount = typeof paidAmount === 'string' ? parseFloat(paidAmount) : paidAmount;
        return sum + (amount || 0);
      }, 0) / settledInvoices.length
    : 0;
    
  console.log('Average transaction calculation:', {
    settledCount: settledInvoices.length,
    avgValue: avgTransactionValue,
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
    totalInvoices: invoices.length,
    settledInvoices: settledInvoices.length,
  };
}

export async function getRevenueProjection() {
  const metrics = await getDashboardMetrics();
  if (!metrics || !metrics.revenueByMonth) return null;
  
  // Simple linear regression for projection
  const data = metrics.revenueByMonth.map((item, index) => ({
    x: index,
    y: item.revenue,
  }));
  
  const n = data.length;
  const sumX = data.reduce((sum, item) => sum + item.x, 0);
  const sumY = data.reduce((sum, item) => sum + item.y, 0);
  const sumXY = data.reduce((sum, item) => sum + item.x * item.y, 0);
  const sumX2 = data.reduce((sum, item) => sum + item.x * item.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Project next 3 months
  const projections = [];
  for (let i = 1; i <= 3; i++) {
    const x = n - 1 + i;
    const projectedRevenue = slope * x + intercept;
    const monthDate = subMonths(new Date(), -i);
    
    projections.push({
      month: format(monthDate, 'MMM yyyy'),
      revenue: Math.max(0, projectedRevenue), // Ensure non-negative
      isProjection: true,
    });
  }
  
  return {
    historical: metrics.revenueByMonth,
    projections,
    trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
    growthRate: metrics.growthRate,
  };
}