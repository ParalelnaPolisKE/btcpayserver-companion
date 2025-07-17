import { getDashboardMetrics } from '@/app/actions/dashboard';
import DashboardClient from './dashboard-client';
import { STORES, ALL_STORES_ID } from '@/lib/stores';

interface DashboardPageProps {
  searchParams: Promise<{ storeId?: string; posOnly?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const selectedStoreId = params.storeId || STORES[0].storeId;
  const isAllStores = selectedStoreId === ALL_STORES_ID;
  const showPosOnly = params.posOnly === 'true';
  
  const metrics = await getDashboardMetrics(
    isAllStores ? undefined : selectedStoreId,
    isAllStores,
    showPosOnly
  );
  
  if (!metrics) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load dashboard metrics.</p>
          <p className="text-sm text-muted-foreground mt-2">Please check your BTCPay Server connection.</p>
        </div>
      </div>
    );
  }
  
  return <DashboardClient metrics={metrics} selectedStoreId={selectedStoreId} showPosOnly={showPosOnly} />;
}