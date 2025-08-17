/**
 * Type definitions for the Payment Analytics plugin
 * These types ensure type safety throughout the plugin
 */

/**
 * Represents a payment/invoice from BTCPay Server
 */
export interface Payment {
  id: string;
  storeId: string;
  amount: string;
  currency: string;
  status: 'New' | 'Processing' | 'Expired' | 'Invalid' | 'Settled';
  createdTime: number;
  paidAmount?: string;
  paymentMethod?: string;
  buyer?: {
    email?: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Time period options for analytics
 */
export type TimePeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  topPaymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  revenueByDay: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  statusBreakdown: Record<string, number>;
}

/**
 * Plugin settings stored in IndexedDB
 */
export interface PluginSettings {
  defaultTimePeriod: TimePeriod;
  refreshInterval: number; // in seconds
  displayCurrency: 'BTC' | 'USD' | 'EUR';
  showNotifications: boolean;
  chartType: 'line' | 'bar' | 'area';
  theme: 'light' | 'dark' | 'auto';
}

/**
 * API response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Error types for better error handling
 */
export const ErrorType = {
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * Plugin Error type (as interface to avoid runtime dependencies)
 */
export interface PluginError extends Error {
  type: ErrorType;
  details?: any;
}