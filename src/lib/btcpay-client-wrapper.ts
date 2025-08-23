/**
 * Client-side wrapper for BTCPay API calls
 * Used for static export builds (Tauri desktop app)
 */

import { BTCPayClient } from "@/services/btcpay-client";
import { BTCPayMockClient } from "@/services/btcpay-mock";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Get configuration from localStorage or environment
function getConfig() {
  if (!isBrowser) {
    return {
      serverUrl: process.env.NEXT_PUBLIC_BTCPAY_URL || "https://btcpay.example.com",
      apiKey: "",
      storeId: process.env.NEXT_PUBLIC_STORE_ID || "store-1",
      useMock: true,
    };
  }

  const apiKey = localStorage.getItem("btcpay_api_key") || "";
  const serverUrl = localStorage.getItem("btcpay_server_url") || 
    process.env.NEXT_PUBLIC_BTCPAY_URL || "https://btcpay.example.com";
  const storeId = localStorage.getItem("btcpay_store_id") || 
    process.env.NEXT_PUBLIC_STORE_ID || "store-1";
  const useMock = !apiKey || process.env.NEXT_PUBLIC_USE_MOCK === "true";

  return {
    serverUrl,
    apiKey,
    storeId,
    useMock,
  };
}

// Create a client instance
export function createBTCPayClient() {
  const config = getConfig();
  const ClientClass = config.useMock ? BTCPayMockClient : BTCPayClient;
  return new ClientClass(config);
}

// Wrapper functions for common operations
export async function fetchInvoices(params?: {
  skip?: number;
  take?: number;
  startDate?: string;
  endDate?: string;
  status?: string[];
}) {
  try {
    const client = createBTCPayClient();
    const invoices = await client.getInvoices(params);
    return {
      success: true,
      invoices: invoices || [],
      isUsingMockData: getConfig().useMock,
    };
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return {
      success: false,
      invoices: [],
      error: error instanceof Error ? error.message : "Failed to fetch invoices",
      isUsingMockData: true,
    };
  }
}

export async function fetchStores() {
  try {
    const client = createBTCPayClient();
    const stores = await client.getAvailableStores();
    return {
      success: true,
      stores: stores.filter((store) => !store.archived),
      isUsingMockData: getConfig().useMock,
    };
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return {
      success: false,
      stores: [],
      error: error instanceof Error ? error.message : "Failed to fetch stores",
      isUsingMockData: true,
    };
  }
}

export async function fetchStorePOSApps(storeId: string) {
  try {
    const config = getConfig();
    const ClientClass = config.useMock ? BTCPayMockClient : BTCPayClient;
    const client = new ClientClass({
      ...config,
      storeId,
    });
    const posApps = await client.getStorePOSApps(storeId);
    return {
      success: true,
      posApps,
      isUsingMockData: config.useMock,
    };
  } catch (error) {
    console.error("Failed to fetch POS apps:", error);
    return {
      success: false,
      posApps: [],
      error: error instanceof Error ? error.message : "Failed to fetch POS apps",
      isUsingMockData: true,
    };
  }
}