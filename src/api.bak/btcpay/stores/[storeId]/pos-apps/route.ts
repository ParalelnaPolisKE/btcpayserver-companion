import { type NextRequest, NextResponse } from "next/server";
import { clientEnv, serverEnv } from "@/lib/env";
import { BTCPayClient } from "@/services/btcpay-client";
import { BTCPayMockClient } from "@/services/btcpay-mock";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const apiKey = serverEnv.btcpayApiKey;
    const serverUrl =
      process.env.NEXT_PUBLIC_BTCPAY_URL || "https://btcpay.example.com";

    const config = {
      serverUrl,
      apiKey: apiKey || "",
      storeId,
    };

    // Use mock client if no API key or mock mode is forced
    const ClientClass =
      !apiKey || clientEnv.useMock ? BTCPayMockClient : BTCPayClient;
    const client = new ClientClass(config);

    const posApps = await client.getStorePOSApps(storeId);

    return NextResponse.json({
      success: true,
      posApps,
      isUsingMockData: !apiKey || clientEnv.useMock,
    });
  } catch (error) {
    console.error("Failed to fetch POS apps:", error);
    return NextResponse.json(
      {
        success: false,
        posApps: [],
        error:
          error instanceof Error ? error.message : "Failed to fetch POS apps",
        isUsingMockData: true,
      },
      { status: 500 },
    );
  }
}
