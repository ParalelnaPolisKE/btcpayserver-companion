// Monthly operational expenses configuration
export const MONTHLY_EXPENSES = {
  rent: 700,
  electricity: 232.12,
  gas: 61.85,
  antikInternet: 41.48,
};

export const SLOVAK_VAT_RATE = 0.23; // 23%

export function calculateTotalMonthlyExpenses(includeVat: boolean = false): number {
  const baseTotal = Object.values(MONTHLY_EXPENSES).reduce((sum, expense) => sum + expense, 0);
  return includeVat ? baseTotal * (1 + SLOVAK_VAT_RATE) : baseTotal;
}

export function getExpenseBreakdown(includeVat: boolean = false) {
  const baseExpenses = {
    'Rent': MONTHLY_EXPENSES.rent,
    'Electricity': MONTHLY_EXPENSES.electricity,
    'Gas': MONTHLY_EXPENSES.gas,
    'ANTIK Internet': MONTHLY_EXPENSES.antikInternet,
  };
  
  if (!includeVat) {
    return baseExpenses;
  }
  
  // Apply VAT to each expense
  const expensesWithVat: Record<string, number> = {};
  Object.entries(baseExpenses).forEach(([key, value]) => {
    expensesWithVat[key] = value * (1 + SLOVAK_VAT_RATE);
  });
  
  return expensesWithVat;
}

export function formatExpenseBreakdown(includeVat: boolean = false): string {
  const breakdown = getExpenseBreakdown(includeVat);
  const lines = Object.entries(breakdown).map(
    ([name, amount]) => `${name}: €${amount.toFixed(2)}`
  );
  
  const total = calculateTotalMonthlyExpenses(includeVat);
  lines.push('─────────────');
  lines.push(`Total: €${total.toFixed(2)}`);
  
  if (includeVat) {
    lines.push(`(incl. ${(SLOVAK_VAT_RATE * 100).toFixed(0)}% VAT)`);
  }
  
  return lines.join('\n');
}