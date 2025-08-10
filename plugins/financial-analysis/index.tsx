import React from 'react';
import FinancialAnalysisApp from './FinancialAnalysisApp';
import FinancialAnalysisSettings from './FinancialAnalysisSettings';

// Plugin metadata export
export const metadata = {
  id: 'financial-analysis',
  name: 'Financial Analysis',
  version: '1.0.0',
};

// Main app component
export default function FinancialAnalysisPlugin({ route }: { route: string }) {
  // Handle different routes within the plugin
  switch (route) {
    case '/settings':
      return <FinancialAnalysisSettings />;
    default:
      return <FinancialAnalysisApp />;
  }
}

// Export individual components for direct access
export { FinancialAnalysisApp, FinancialAnalysisSettings };