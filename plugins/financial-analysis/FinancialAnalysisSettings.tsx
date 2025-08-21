"use client";

import { StoresProvider } from "./contexts/stores-context";
import FinancialAnalysisSettingsContent from "./FinancialAnalysisSettingsContent";

export default function FinancialAnalysisSettings() {
  return (
    <StoresProvider>
      <FinancialAnalysisSettingsContent />
    </StoresProvider>
  );
}
