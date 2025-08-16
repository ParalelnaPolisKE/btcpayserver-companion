/**
 * Constants used throughout the plugin
 */

/**
 * Storage keys for IndexedDB
 */
export const STORAGE_KEYS = {
  SETTINGS: 'payment_analytics_settings',
  CACHE: 'payment_analytics_cache',
  LAST_SYNC: 'payment_analytics_last_sync'
} as const;

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS = {
  defaultTimePeriod: '30d' as const,
  refreshInterval: 60, // seconds
  displayCurrency: 'USD' as const,
  showNotifications: true,
  chartType: 'line' as const,
  theme: 'auto' as const
};

/**
 * API endpoints (relative to BTCPay Server URL)
 */
export const API_ENDPOINTS = {
  INVOICES: '/api/v1/stores/{storeId}/invoices',
  STORE_INFO: '/api/v1/stores/{storeId}',
  PAYMENT_METHODS: '/api/v1/stores/{storeId}/payment-methods'
} as const;

/**
 * Chart color palette
 */
export const CHART_COLORS = {
  primary: '#10B981',
  secondary: '#3B82F6',
  tertiary: '#F59E0B',
  quaternary: '#EF4444',
  quinary: '#8B5CF6'
} as const;

/**
 * Animation durations (in ms)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500
} as const;

/**
 * Polling intervals (in ms)
 */
export const POLLING_INTERVALS = {
  ACTIVE: 5000,    // 5 seconds when tab is active
  INACTIVE: 30000  // 30 seconds when tab is inactive
} as const;