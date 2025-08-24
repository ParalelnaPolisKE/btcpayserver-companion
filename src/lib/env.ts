// Server-side environment variables
export const serverEnv = {
  get btcpayApiKey() {
    return process.env.BTCPAYSERVER_API_KEY || "";
  }
};

// Client-side environment variables
export const clientEnv = {
  get btcpayUrl() {
    return process.env.NEXT_PUBLIC_BTCPAY_URL || "https://btcpay.example.com";
  },
  get storeId() {
    return process.env.NEXT_PUBLIC_STORE_ID || "store-1";
  },
  get useMock() {
    return process.env.NEXT_PUBLIC_USE_MOCK === "true";
  }
};

// Helper for testing - allows mocking the runtime environment
export const isServerSide = () => typeof window === "undefined";

// This will be set from the server
export const isUsingMockData = () => {
  if (isServerSide()) {
    // Server-side: check if API key exists
    return !serverEnv.btcpayApiKey || clientEnv.useMock;
  }
  // Client-side: this should be passed from server
  return true; // Default to mock on client
};
