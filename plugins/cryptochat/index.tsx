/**
 * CryptoChat Plugin - Main Entry Point
 * 
 * AI-powered chat interface with RAG for querying BTCPayServer data
 * using natural language processing and vector embeddings.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingSkeleton } from "./components/LoadingSkeleton";

// Lazy load the main component for better performance
const CryptoChatPanel = lazy(() => import("./components/CryptoChatPanel"));

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

export interface CryptoChatPluginProps {
  invoices?: any[];
}

/**
 * Plugin Component
 * This is the main component that gets rendered when the plugin is loaded
 */
export default function CryptoChatPlugin({ invoices = [] }: CryptoChatPluginProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingSkeleton />}>
          <CryptoChatPanel invoices={invoices} />
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
  const SettingsComponent = lazy(() => import("./components/CryptoChatSettings"));

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
  console.log("CryptoChat plugin initialized");
  
  // Check if vector DB needs initialization
  if (typeof window !== 'undefined') {
    const { initVectorDB } = await import('./utils/vector-db');
    await initVectorDB();
  }
  
  return true;
}

/**
 * Plugin cleanup (optional)
 * Called when the plugin is unloaded
 */
export async function cleanup() {
  console.log("CryptoChat plugin cleanup");
  
  // Clear query cache
  queryClient.clear();
  
  // Clean up vector DB resources
  if (typeof window !== 'undefined') {
    const { closeVectorDB } = await import('./utils/vector-db');
    await closeVectorDB();
  }
}