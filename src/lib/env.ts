// Server-side environment variables
export const serverEnv = {
  btcpayApiKey: process.env.BTCPAYSERVER_API_KEY || '',
};

// Client-side environment variables
export const clientEnv = {
  btcpayUrl: process.env.NEXT_PUBLIC_BTCPAY_URL || 'https://btcpay.example.com',
  storeId: process.env.NEXT_PUBLIC_STORE_ID || 'store-1',
  eventId: process.env.NEXT_PUBLIC_EVENT_ID || 'event-1',
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
};

// This will be set from the server
export const isUsingMockData = () => {
  if (typeof window === 'undefined') {
    // Server-side: check if API key exists
    return !serverEnv.btcpayApiKey || clientEnv.useMock;
  }
  // Client-side: this should be passed from server
  return true; // Default to mock on client
};