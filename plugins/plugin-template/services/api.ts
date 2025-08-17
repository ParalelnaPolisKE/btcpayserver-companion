/**
 * API Service for BTCPay Server Greenfield API integration
 * Demonstrates proper API client patterns and error handling
 */

import { API_ENDPOINTS } from '../utils/constants';
import { ErrorType } from '../types';
import type { Payment, TimePeriod, AnalyticsData, ApiResponse } from '../types';

/**
 * Custom error class for the plugin
 */
class PluginError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

// Get base configuration from parent app
const getConfig = () => {
  // In a real plugin, this would come from the parent app's context
  return {
    baseUrl: process.env.NEXT_PUBLIC_BTCPAY_URL || 'https://btcpay.example.com',
    storeId: process.env.NEXT_PUBLIC_STORE_ID || 'store_123',
    apiKey: process.env.BTCPAYSERVER_API_KEY || '',
  };
};

/**
 * Base API client with error handling
 */
class ApiClient {
  private baseUrl: string;
  private storeId: string;
  private headers: HeadersInit;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.baseUrl;
    this.storeId = config.storeId;
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.apiKey && { 'Authorization': `token ${config.apiKey}` }),
    };
  }

  /**
   * Make an API request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint.replace('{storeId}', this.storeId)}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof PluginError) {
        throw error;
      }
      
      throw new PluginError(
        ErrorType.NETWORK_ERROR,
        'Network request failed',
        error
      );
    }
  }

  /**
   * Handle API error responses
   */
  private async handleErrorResponse(response: Response): Promise<PluginError> {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    let errorType: ErrorType = ErrorType.API_ERROR;
    let details: any = {};

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      details = errorData;
    } catch {
      // Response is not JSON
    }

    // Determine error type based on status code
    if (response.status === 401 || response.status === 403) {
      errorType = ErrorType.PERMISSION_ERROR;
    } else if (response.status === 400) {
      errorType = ErrorType.VALIDATION_ERROR;
    }

    return new PluginError(errorType, errorMessage, details);
  }

  /**
   * Get invoices/payments from BTCPay Server
   */
  async getInvoices(params: {
    skip?: number;
    take?: number;
    status?: string[];
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Payment[]> {
    const queryParams = new URLSearchParams();
    
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.take !== undefined) queryParams.append('take', params.take.toString());
    if (params.status) params.status.forEach(s => queryParams.append('status', s));
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = `${API_ENDPOINTS.INVOICES}?${queryParams.toString()}`;
    const response = await this.request<Payment[]>(endpoint);
    
    return response.data || [];
  }

  /**
   * Get store information
   */
  async getStoreInfo(): Promise<any> {
    const response = await this.request(API_ENDPOINTS.STORE_INFO);
    return response.data;
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<any[]> {
    const response = await this.request<any[]>(API_ENDPOINTS.PAYMENT_METHODS);
    return response.data || [];
  }
}

// Create singleton instance
const apiClient = new ApiClient();

/**
 * Fetch invoices for a given time period
 */
export async function fetchInvoices(timePeriod: TimePeriod): Promise<Payment[]> {
  const now = new Date();
  let startDate: Date;

  switch (timePeriod) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      // For 'all', we'll fetch without date filter
      return apiClient.getInvoices({ take: 1000 });
  }

  return apiClient.getInvoices({
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    take: 1000, // Adjust based on your needs
  });
}

/**
 * Process invoices into analytics data
 */
export async function fetchAnalytics(invoices: Payment[]): Promise<AnalyticsData> {
  // Calculate total revenue (only settled invoices)
  const settledInvoices = invoices.filter(i => i.status === 'Settled');
  const totalRevenue = settledInvoices.reduce((sum, invoice) => {
    return sum + parseFloat(invoice.amount);
  }, 0);

  // Calculate average transaction
  const averageTransaction = settledInvoices.length > 0 
    ? totalRevenue / settledInvoices.length 
    : 0;

  // Group by payment method
  const methodCounts = invoices.reduce((acc, invoice) => {
    const method = invoice.paymentMethod || 'Unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
  const statusBreakdown = invoices.reduce((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
function groupRevenueByDay(invoices: Payment[]): Array<{ date: string; amount: number; count: number }> {
  const grouped = invoices.reduce((acc, invoice) => {
    const date = new Date(invoice.createdTime * 1000).toISOString().split('T')[0];
    
    if (!acc[date]) {
      acc[date] = { date, amount: 0, count: 0 };
    }
    
    acc[date].amount += parseFloat(invoice.amount);
    acc[date].count += 1;
    
    return acc;
  }, {} as Record<string, { date: string; amount: number; count: number }>);

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
      date: date.toISOString().split('T')[0],
      amount: Math.random() * 5000 + 1000,
      count: Math.floor(Math.random() * 20) + 5,
    };
  });

  const totalRevenue = revenueByDay.reduce((sum, day) => sum + day.amount, 0);
  const totalTransactions = revenueByDay.reduce((sum, day) => sum + day.count, 0);

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction: totalRevenue / totalTransactions,
    topPaymentMethods: [
      { method: 'Bitcoin', count: 45, percentage: 45 },
      { method: 'Lightning', count: 30, percentage: 30 },
      { method: 'Credit Card', count: 20, percentage: 20 },
      { method: 'Other', count: 5, percentage: 5 },
    ],
    revenueByDay,
    statusBreakdown: {
      'Settled': Math.floor(totalTransactions * 0.8),
      'Processing': Math.floor(totalTransactions * 0.1),
      'New': Math.floor(totalTransactions * 0.05),
      'Expired': Math.floor(totalTransactions * 0.03),
      'Invalid': Math.floor(totalTransactions * 0.02),
    },
  };
}

// Export additional utilities
export { apiClient };