/**
 * Payment Analytics Plugin - Main Entry Point
 * 
 * This file demonstrates how to create a BTCPayServer Companion plugin
 * that integrates with the Greenfield API and follows best practices.
 */

import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSkeleton } from './components/LoadingSkeleton';

// Lazy load the main component for better performance
const PaymentAnalytics = lazy(() => import('./components/PaymentAnalytics'));

// Create a QueryClient instance for this plugin
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

/**
 * Plugin Component
 * This is the main component that gets rendered when the plugin is loaded
 */
export default function PaymentAnalyticsPlugin() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingSkeleton />}>
          <PaymentAnalytics />
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

/**
 * Plugin Settings Component (optional)
 * This component is rendered in the settings panel if settings: true in manifest
 */
export function Settings() {
  const SettingsComponent = lazy(() => import('./components/PaymentSettings'));
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}>
        <SettingsComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Plugin initialization (optional)
 * Called when the plugin is first loaded
 */
export async function init() {
  console.log('Payment Analytics plugin initialized');
  
  // Perform any initialization tasks here
  // e.g., check permissions, validate config, etc.
  
  return true;
}

/**
 * Plugin cleanup (optional)
 * Called when the plugin is unloaded
 */
export function cleanup() {
  console.log('Payment Analytics plugin cleanup');
  
  // Perform any cleanup tasks here
  // e.g., clear cache, cancel subscriptions, etc.
  
  queryClient.clear();
}