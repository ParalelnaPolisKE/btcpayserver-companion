import { NextRequest, NextResponse } from "next/server";
import { clientEnv, serverEnv } from "@/lib/env";
import { BTCPayClient } from "@/services/btcpay-client";
import { BTCPayMockClient } from "@/services/btcpay-mock";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined;
    const take = searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const status = searchParams.getAll("status") || undefined;

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

    // Fetch invoices with parameters
    const invoices = await client.getInvoices({
      skip,
      take: take || 100, // Default to 100 invoices
      startDate,
      endDate,
      status: status && status.length > 0 ? status : undefined,
    });

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
      isUsingMockData: !apiKey || clientEnv.useMock,
    });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      {
        success: false,
        invoices: [],
        error: error instanceof Error ? error.message : "Failed to fetch invoices",
        isUsingMockData: true,
      },
      { status: 500 }
    );
  }
}