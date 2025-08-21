// Default monthly operational expenses configuration (used as fallback only)
export const MONTHLY_EXPENSES = {
  rent: 700,
  electricity: 232.12,
  gas: 61.85,
  antikInternet: 41.48,
};

// Note: VAT should be configured in Settings. This is only used as a fallback.
export function calculateTotalMonthlyExpenses(
  includeVat = false,
  vatRate = 0,
): number {
  const baseTotal = Object.values(MONTHLY_EXPENSES).reduce(
    (sum, expense) => sum + expense,
    0,
  );
  // Only apply VAT if explicitly requested AND a VAT rate is provided
  return includeVat && vatRate > 0 ? baseTotal * (1 + vatRate) : baseTotal;
}

export function getExpenseBreakdown(includeVat = false, vatRate = 0) {
  const baseExpenses = {
    Rent: MONTHLY_EXPENSES.rent,
    Electricity: MONTHLY_EXPENSES.electricity,
    Gas: MONTHLY_EXPENSES.gas,
    "ANTIK Internet": MONTHLY_EXPENSES.antikInternet,
  };

  if (!includeVat || vatRate === 0) {
    return baseExpenses;
  }

  // Apply VAT to each expense
  const expensesWithVat: Record<string, number> = {};
  Object.entries(baseExpenses).forEach(([key, value]) => {
    expensesWithVat[key] = value * (1 + vatRate);
  });

  return expensesWithVat;
}

export function formatExpenseBreakdown(
  includeVat = false,
  vatRate = 0,
): string {
  const breakdown = getExpenseBreakdown(includeVat, vatRate);
  const lines = Object.entries(breakdown).map(
    ([name, amount]) => `${name}: €${amount.toFixed(2)}`,
  );

  const total = calculateTotalMonthlyExpenses(includeVat, vatRate);
  lines.push("─────────────");
  lines.push(`Total: €${total.toFixed(2)}`);

  if (includeVat && vatRate > 0) {
    lines.push(`(incl. ${(vatRate * 100).toFixed(0)}% VAT)`);
  }

  return lines.join("\n");
}
