/**
 * API Service for BTCPay Server Greenfield API integration
 * Following the same pattern as financial-analysis plugin
 */

"use client";

import { clientEnv } from "@bps-companion/lib/env";
import { BTCPayClient } from "@bps-companion/services/btcpay-client";
import { BTCPayMockClient } from "@bps-companion/services/btcpay-mock";
import type { AnalyticsData, ApiResponse, Payment, TimePeriod } from "../types";
import { ErrorType } from "../types";

/**
 * Custom error class for the plugin
 */
class PluginError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "PluginError";
  }
}

/**
 * Get client instance - following the same pattern as financial-analysis plugin
 */
const getClient = (storeId?: string) => {
  // Check for API key from localStorage or environment
  const apiKey =
    typeof window !== "undefined"
      ? localStorage.getItem("btcpay_api_key") ||
        process.env.NEXT_PUBLIC_BTCPAY_API_KEY ||
        ""
      : process.env.NEXT_PUBLIC_BTCPAY_API_KEY || "";

  const isUsingMock = !apiKey || clientEnv.useMock;
  const finalStoreId = storeId || clientEnv.storeId;

  if (isUsingMock) {
    return new BTCPayMockClient({
      serverUrl: clientEnv.btcpayUrl,
      apiKey: "mock-api-key",
      storeId: finalStoreId,
    });
  }

  return new BTCPayClient({
    serverUrl: clientEnv.btcpayUrl,
    apiKey: apiKey,
    storeId: finalStoreId,
  });
};

/**
 * Generate mock invoices for demonstration
 */
function generateMockInvoices(timePeriod: TimePeriod): Payment[] {
  const now = new Date();
  let days = 30;
  
  switch (timePeriod) {
    case "24h":
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    case "1y":
      days = 365;
      break;
    case "all":
      days = 365 * 2;
      break;
  }
  
  const invoices: Payment[] = [];
  const statuses = ["Settled", "Processing", "New", "Expired", "Invalid"] as const;
  const methods = ["Bitcoin", "Lightning", "Litecoin", "Monero"];
  
  for (let i = 0; i < days * 5; i++) {
    const createdTime = now.getTime() / 1000 - (Math.random() * days * 24 * 60 * 60);
    invoices.push({
      id: `inv_${i}`,
      storeId: "store_123",
      amount: (Math.random() * 500 + 10).toFixed(2),
      currency: "EUR",
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdTime,
      paymentMethod: methods[Math.floor(Math.random() * methods.length)],
      metadata: {},
    });
  }
  
  return invoices.sort((a, b) => b.createdTime - a.createdTime);
}

/**
 * Fetch invoices for a given time period
 */
export async function fetchInvoices(
  timePeriod: TimePeriod,
  storeId?: string,
): Promise<Payment[]> {
  const client = getClient(storeId);
  
  // Check if using mock client
  if (client instanceof BTCPayMockClient) {
    return generateMockInvoices(timePeriod);
  }
  
  const now = new Date();
  let startDate: Date;

  switch (timePeriod) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      // For 'all', we'll fetch without date filter
      const invoices = await client.getInvoices({ take: 1000 });
      return invoices.map((invoice: any) => ({
        id: invoice.id,
        storeId: invoice.storeId,
        amount: invoice.amount || "0",
        currency: invoice.currency,
        status: invoice.status,
        createdTime: invoice.createdTime,
        paymentMethod: invoice.type || "Unknown",
        metadata: invoice.metadata || {},
      }));
  }

  const invoices = await client.getInvoices({
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    take: 1000,
  });
  
  return invoices.map((invoice: any) => ({
    id: invoice.id,
    storeId: invoice.storeId,
    amount: invoice.amount || "0",
    currency: invoice.currency,
    status: invoice.status,
    createdTime: invoice.createdTime,
    paymentMethod: invoice.type || "Unknown",
    metadata: invoice.metadata || {},
  }));
}

/**
 * Process invoices into analytics data
 */
export async function fetchAnalytics(
  invoices: Payment[],
): Promise<AnalyticsData> {
  // Calculate total revenue (only settled invoices)
  const settledInvoices = invoices.filter((i) => i.status === "Settled");
  const totalRevenue = settledInvoices.reduce((sum, invoice) => {
    return sum + Number.parseFloat(invoice.amount);
  }, 0);

  // Calculate average transaction
  const averageTransaction =
    settledInvoices.length > 0 ? totalRevenue / settledInvoices.length : 0;

  // Group by payment method
  const methodCounts = invoices.reduce(
    (acc, invoice) => {
      const method = invoice.paymentMethod || "Unknown";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Convert to array and calculate percentages
  const total = invoices.length;
  const topPaymentMethods = Object.entries(methodCounts)
    .map(([method, count]) => ({
      method,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 methods

  // Group revenue by day
  const revenueByDay = groupRevenueByDay(settledInvoices);

  // Status breakdown
  const statusBreakdown = invoices.reduce(
    (acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalRevenue,
    totalTransactions: invoices.length,
    averageTransaction,
    topPaymentMethods,
    revenueByDay,
    statusBreakdown,
  };
}

/**
 * Group revenue by day for chart display
 */
function groupRevenueByDay(
  invoices: Payment[],
): Array<{ date: string; amount: number; count: number }> {
  const grouped = invoices.reduce(
    (acc, invoice) => {
      const date = new Date(invoice.createdTime * 1000)
        .toISOString()
        .split("T")[0];

      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0 };
      }

      acc[date].amount += Number.parseFloat(invoice.amount);
      acc[date].count += 1;

      return acc;
    },
    {} as Record<string, { date: string; amount: number; count: number }>,
  );

  // Sort by date and return as array
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Mock data generator for development
 */
export function generateMockData(): AnalyticsData {
  const days = 30;
  const revenueByDay = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    return {
      date: date.toISOString().split("T")[0],
      amount: Math.random() * 5000 + 1000,
      count: Math.floor(Math.random() * 20) + 5,
    };
  });

  const totalRevenue = revenueByDay.reduce((sum, day) => sum + day.amount, 0);
  const totalTransactions = revenueByDay.reduce(
    (sum, day) => sum + day.count,
    0,
  );

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction: totalRevenue / totalTransactions,
    topPaymentMethods: [
      { method: "Bitcoin", count: 45, percentage: 45 },
      { method: "Lightning", count: 30, percentage: 30 },
      { method: "Litecoin", count: 15, percentage: 15 },
      { method: "Monero", count: 10, percentage: 10 },
    ],
    revenueByDay,
    statusBreakdown: {
      Settled: Math.floor(totalTransactions * 0.8),
      Processing: Math.floor(totalTransactions * 0.1),
      New: Math.floor(totalTransactions * 0.05),
      Expired: Math.floor(totalTransactions * 0.03),
      Invalid: Math.floor(totalTransactions * 0.02),
    },
  };
}

// Export additional utilities
export { getClient };