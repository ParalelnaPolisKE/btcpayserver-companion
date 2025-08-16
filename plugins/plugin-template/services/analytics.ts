/**
 * Analytics Service
 * Processes payment data into meaningful insights
 */

import type { Payment, AnalyticsData } from '../types';

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowData = data.slice(start, i + 1);
    const avg = windowData.reduce((sum, val) => sum + val, 0) / windowData.length;
    result.push(avg);
  }
  
  return result;
}

/**
 * Detect trends in data
 */
export function detectTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';
  
  // Simple linear regression
  const n = data.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = data.reduce((sum, val) => sum + val, 0);
  const sumXY = data.reduce((sum, val, i) => sum + val * i, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Determine trend based on slope
  const avgValue = sumY / n;
  const slopePercentage = (slope / avgValue) * 100;
  
  if (slopePercentage > 5) return 'up';
  if (slopePercentage < -5) return 'down';
  return 'stable';
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(
  settled: number,
  total: number
): number {
  if (total === 0) return 0;
  return (settled / total) * 100;
}

/**
 * Find peak periods
 */
export function findPeakPeriods(
  data: Array<{ date: string; amount: number; count: number }>
): { hour?: number; dayOfWeek?: number; dayOfMonth?: number } {
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  const monthDayCounts = new Array(31).fill(0);
  
  data.forEach(item => {
    const date = new Date(item.date);
    hourCounts[date.getHours()] += item.count;
    dayCounts[date.getDay()] += item.count;
    monthDayCounts[date.getDate() - 1] += item.count;
  });
  
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
  const peakMonthDay = monthDayCounts.indexOf(Math.max(...monthDayCounts)) + 1;
  
  return {
    hour: peakHour,
    dayOfWeek: peakDay,
    dayOfMonth: peakMonthDay,
  };
}

/**
 * Calculate percentiles
 */
export function calculatePercentiles(
  values: number[],
  percentiles: number[] = [25, 50, 75, 90, 95]
): Record<number, number> {
  const sorted = [...values].sort((a, b) => a - b);
  const result: Record<number, number> = {};
  
  percentiles.forEach(p => {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    result[p] = sorted[Math.max(0, index)];
  });
  
  return result;
}

/**
 * Group payments by time interval
 */
export function groupByInterval(
  payments: Payment[],
  interval: 'hour' | 'day' | 'week' | 'month'
): Map<string, Payment[]> {
  const grouped = new Map<string, Payment[]>();
  
  payments.forEach(payment => {
    const date = new Date(payment.createdTime * 1000);
    let key: string;
    
    switch (interval) {
      case 'hour':
        key = `${date.toISOString().slice(0, 13)}:00`;
        break;
      case 'day':
        key = date.toISOString().slice(0, 10);
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = date.toISOString().slice(0, 7);
        break;
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(payment);
  });
  
  return grouped;
}

/**
 * Calculate cohort retention
 */
export function calculateCohortRetention(
  payments: Payment[],
  cohortField: 'buyer' | 'paymentMethod' = 'buyer'
): Map<string, number[]> {
  const cohorts = new Map<string, Set<string>[]>();
  const retention = new Map<string, number[]>();
  
  // Group by month cohorts
  const monthlyGroups = groupByInterval(payments, 'month');
  
  monthlyGroups.forEach((monthPayments, month) => {
    const uniqueValues = new Set<string>();
    
    monthPayments.forEach(payment => {
      const value = cohortField === 'buyer' 
        ? payment.buyer?.email || 'unknown'
        : payment.paymentMethod || 'unknown';
      uniqueValues.add(value);
    });
    
    cohorts.set(month, [uniqueValues]);
  });
  
  // Calculate retention rates
  cohorts.forEach((cohortData, cohortMonth) => {
    const initialSize = cohortData[0].size;
    const retentionRates = cohortData.map(monthData => 
      initialSize > 0 ? (monthData.size / initialSize) * 100 : 0
    );
    retention.set(cohortMonth, retentionRates);
  });
  
  return retention;
}

/**
 * Forecast future revenue
 */
export function forecastRevenue(
  historicalData: Array<{ date: string; amount: number }>,
  daysToForecast: number = 30
): Array<{ date: string; amount: number; isForecast: boolean }> {
  if (historicalData.length < 7) {
    // Not enough data for forecasting
    return historicalData.map(d => ({ ...d, isForecast: false }));
  }
  
  // Simple moving average forecast
  const recentDays = 7;
  const recentData = historicalData.slice(-recentDays);
  const avgDailyRevenue = recentData.reduce((sum, d) => sum + d.amount, 0) / recentDays;
  
  // Calculate trend
  const trend = detectTrend(recentData.map(d => d.amount));
  const trendMultiplier = trend === 'up' ? 1.05 : trend === 'down' ? 0.95 : 1;
  
  const forecast: Array<{ date: string; amount: number; isForecast: boolean }> = [
    ...historicalData.map(d => ({ ...d, isForecast: false }))
  ];
  
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  
  for (let i = 1; i <= daysToForecast; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Add some randomness to make it more realistic
    const randomFactor = 0.9 + Math.random() * 0.2;
    const forecastAmount = avgDailyRevenue * Math.pow(trendMultiplier, i / 7) * randomFactor;
    
    forecast.push({
      date: forecastDate.toISOString().slice(0, 10),
      amount: forecastAmount,
      isForecast: true,
    });
  }
  
  return forecast;
}

/**
 * Identify anomalies in payment data
 */
export function detectAnomalies(
  data: number[],
  threshold: number = 2
): number[] {
  if (data.length < 3) return [];
  
  // Calculate mean and standard deviation
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // Find anomalies (values outside threshold * stdDev)
  const anomalyIndices: number[] = [];
  
  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);
    if (zScore > threshold) {
      anomalyIndices.push(index);
    }
  });
  
  return anomalyIndices;
}

/**
 * Calculate customer lifetime value
 */
export function calculateCLV(
  payments: Payment[],
  customerField: string = 'buyer.email'
): Map<string, number> {
  const customerValues = new Map<string, number>();
  
  payments.forEach(payment => {
    if (payment.status !== 'Settled') return;
    
    const customer = payment.buyer?.email || 'unknown';
    const currentValue = customerValues.get(customer) || 0;
    customerValues.set(customer, currentValue + parseFloat(payment.amount));
  });
  
  return customerValues;
}

// Export all functions
export const Analytics = {
  calculateGrowth,
  calculateMovingAverage,
  detectTrend,
  calculateConversionRate,
  findPeakPeriods,
  calculatePercentiles,
  groupByInterval,
  calculateCohortRetention,
  forecastRevenue,
  detectAnomalies,
  calculateCLV,
};