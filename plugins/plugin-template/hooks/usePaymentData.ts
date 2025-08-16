/**
 * Custom hook for fetching and managing payment data
 * Demonstrates React Query integration and data fetching patterns
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchInvoices, fetchAnalytics } from '../services/api';
import type { AnalyticsData, TimePeriod } from '../types';
import { POLLING_INTERVALS } from '../utils/constants';

export function usePaymentData(timePeriod: TimePeriod = '30d') {
  const queryClient = useQueryClient();

  // Main data query
  const query = useQuery({
    queryKey: ['payment-analytics', timePeriod],
    queryFn: async () => {
      const invoices = await fetchInvoices(timePeriod);
      const analytics = await fetchAnalytics(invoices);
      return analytics;
    },
    staleTime: 60 * 1000, // Consider data stale after 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Set up polling when tab is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      intervalId = setInterval(() => {
        query.refetch();
      }, POLLING_INTERVALS.ACTIVE);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    // Start polling if document is visible
    if (!document.hidden) {
      startPolling();
    }

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [query]);

  // Prefetch next period for smoother transitions
  useEffect(() => {
    const prefetchNextPeriod = async () => {
      const nextPeriods: Record<TimePeriod, TimePeriod> = {
        '24h': '7d',
        '7d': '30d',
        '30d': '90d',
        '90d': '1y',
        '1y': 'all',
        'all': 'all',
      };

      const nextPeriod = nextPeriods[timePeriod];
      if (nextPeriod !== timePeriod) {
        await queryClient.prefetchQuery({
          queryKey: ['payment-analytics', nextPeriod],
          queryFn: async () => {
            const invoices = await fetchInvoices(nextPeriod);
            return fetchAnalytics(invoices);
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    };

    prefetchNextPeriod();
  }, [timePeriod, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

/**
 * Hook for real-time payment updates
 */
export function useRealtimePayments(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // In a real implementation, this would connect to a WebSocket
    // or Server-Sent Events endpoint for real-time updates
    const mockRealtimeUpdate = () => {
      // Invalidate relevant queries when new payment arrives
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    };

    // Simulate random payment events
    const intervalId = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new payment
        mockRealtimeUpdate();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [enabled, queryClient]);
}

/**
 * Hook for payment statistics
 */
export function usePaymentStats(timePeriod: TimePeriod = '30d') {
  return useQuery({
    queryKey: ['payment-stats', timePeriod],
    queryFn: async () => {
      const invoices = await fetchInvoices(timePeriod);
      
      // Calculate statistics
      const total = invoices.length;
      const settled = invoices.filter(i => i.status === 'Settled').length;
      const pending = invoices.filter(i => i.status === 'New' || i.status === 'Processing').length;
      const failed = invoices.filter(i => i.status === 'Invalid' || i.status === 'Expired').length;
      
      const totalAmount = invoices
        .filter(i => i.status === 'Settled')
        .reduce((sum, i) => sum + parseFloat(i.amount), 0);
      
      const avgAmount = total > 0 ? totalAmount / settled : 0;
      
      return {
        total,
        settled,
        pending,
        failed,
        successRate: total > 0 ? (settled / total) * 100 : 0,
        totalAmount,
        avgAmount,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for payment method distribution
 */
export function usePaymentMethods(timePeriod: TimePeriod = '30d') {
  return useQuery({
    queryKey: ['payment-methods', timePeriod],
    queryFn: async () => {
      const invoices = await fetchInvoices(timePeriod);
      
      // Group by payment method
      const methodCounts = invoices.reduce((acc, invoice) => {
        const method = invoice.paymentMethod || 'Unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Convert to array and calculate percentages
      const total = invoices.length;
      return Object.entries(methodCounts)
        .map(([method, count]) => ({
          method,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}