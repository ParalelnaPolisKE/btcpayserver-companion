"use server";

import { clientEnv, serverEnv } from "@/lib/env";
import { BTCPayClient } from "@/services/btcpay-client";
import { BTCPayMockClient } from "@/services/btcpay-mock";

export async function fetchInvoicesForCryptoChat(params?: {
  skip?: number;
  take?: number;
  startDate?: string;
  endDate?: string;
  status?: string[];
}) {
  try {
    const apiKey = serverEnv.btcpayApiKey;
    const serverUrl =
      process.env.NEXT_PUBLIC_BTCPAY_URL || "https://btcpay.example.com";
    const storeId = process.env.NEXT_PUBLIC_STORE_ID || "store-1";

    const config = {
      serverUrl,
      apiKey: apiKey || "",
      storeId,
    };

    // Use mock client if no API key or mock mode is forced
    const ClientClass =
      !apiKey || clientEnv.useMock ? BTCPayMockClient : BTCPayClient;
    const client = new ClientClass(config);

    // Fetch invoices with default parameters if not provided
    const invoices = await client.getInvoices({
      skip: params?.skip || 0,
      take: params?.take || 100, // Fetch up to 100 invoices by default
      startDate: params?.startDate,
      endDate: params?.endDate,
      status: params?.status,
    });

    return {
      success: true,
      invoices: invoices || [],
      isUsingMockData: !apiKey || clientEnv.useMock,
    };
  } catch (error) {
    console.error("Failed to fetch invoices for CryptoChat:", error);
    return {
      success: false,
      invoices: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch invoices",
      isUsingMockData: true,
    };
  }
}
