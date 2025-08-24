// Bitcoin price service with mock data for the last 30 days

export interface PriceData {
  date: string;
  price: number;
}

// Generate mock Bitcoin price data for the last 30 days
export function getBitcoinPriceData(): PriceData[] {
  const data: PriceData[] = [];
  const today = new Date();
  const basePrice = 95000; // Base price around $95k

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some realistic volatility
    const volatility = Math.sin(i * 0.3) * 3000 + Math.random() * 2000 - 1000;
    const trend = (29 - i) * 150; // Slight upward trend
    const price = Math.round(basePrice + volatility + trend);

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: price,
    });
  }

  return data;
}

// Calculate price change percentage
export function calculatePriceChange(data: PriceData[]): {
  change: number;
  percentage: number;
  isPositive: boolean;
} {
  if (data.length < 2) {
    return { change: 0, percentage: 0, isPositive: true };
  }

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const change = lastPrice - firstPrice;
  const percentage = (change / firstPrice) * 100;

  return {
    change,
    percentage: Math.round(percentage * 10) / 10,
    isPositive: change >= 0,
  };
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
