"use client";

import { StoresProvider } from "./contexts/stores-context";
import FinancialAnalysisApp from "./FinancialAnalysisApp";

export default function FinancialAnalysisWrapper() {
  return (
    <StoresProvider>
      <FinancialAnalysisApp />
    </StoresProvider>
  );
}
