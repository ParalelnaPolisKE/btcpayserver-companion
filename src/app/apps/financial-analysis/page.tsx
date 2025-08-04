import { Suspense } from 'react';
import FinancialAnalysisClient from './financial-analysis-client';

export default function FinancialAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Financial Analysis</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    }>
      <FinancialAnalysisClient />
    </Suspense>
  );
}