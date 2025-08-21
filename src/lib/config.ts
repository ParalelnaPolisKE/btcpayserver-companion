// Application configuration
export const config = {
  app: {
    name: "BTCPayServer Companion",
    version: "0.1.0",
    useMockData: false, // Set to true to use mock data
  },
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
  btcpay: {
    defaultCurrency: "EUR",
    serverUrl: process.env.NEXT_PUBLIC_BTCPAY_URL || "",
    apiKey: process.env.BTCPAY_API_KEY || "",
  },
};
