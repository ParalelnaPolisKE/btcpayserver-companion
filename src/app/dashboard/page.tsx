'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardClient from './dashboard-client';
import { STORES, ALL_STORES_ID } from '@/lib/stores';
import { getDashboardMetrics } from '@/services/dashboard-api';
import type { DashboardMetrics } from '@/types/dashboard';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const selectedStoreId = searchParams.get('storeId') || STORES[0].storeId;
  const isAllStores = selectedStoreId === ALL_STORES_ID;
  const showPosOnly = searchParams.get('posOnly') === 'true';
  
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardMetrics(
          isAllStores ? undefined : selectedStoreId,
          isAllStores,
          showPosOnly
        );
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setError('Failed to load dashboard metrics. Please check your BTCPay Server connection.');
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
  }, [selectedStoreId, isAllStores, showPosOnly]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }
  
  if (error || !metrics) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || 'Failed to load dashboard metrics.'}</p>
          <p className="text-sm text-muted-foreground mt-2">Please check your BTCPay Server connection.</p>
        </div>
      </div>
    );
  }
  
  return <DashboardClient metrics={metrics} selectedStoreId={selectedStoreId} showPosOnly={showPosOnly} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}