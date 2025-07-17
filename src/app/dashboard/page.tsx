import { getDashboardMetrics, getRevenueProjection } from '@/app/actions/dashboard';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const [metrics, projections] = await Promise.all([
    getDashboardMetrics(),
    getRevenueProjection(),
  ]);
  
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
  
  return <DashboardClient metrics={metrics} projections={projections} />;
}