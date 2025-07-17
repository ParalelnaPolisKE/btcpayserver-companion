'use server';

import { BTCPayClient } from '@/services/btcpay-client';
import { BTCPayMockClient } from '@/services/btcpay-mock';
import { serverEnv, clientEnv } from '@/lib/env';
import { Ticket, CheckInResponse } from '@/types';

const getClient = () => {
  const isUsingMock = !serverEnv.btcpayApiKey || clientEnv.useMock;
  
  if (isUsingMock) {
    return new BTCPayMockClient({
      serverUrl: clientEnv.btcpayUrl,
      apiKey: 'mock-api-key',
      storeId: clientEnv.storeId,
    });
  }

  console.log('BTCPay Client Configuration:', {
    serverUrl: clientEnv.btcpayUrl,
    hasApiKey: !!serverEnv.btcpayApiKey,
    apiKeyLength: serverEnv.btcpayApiKey.length,
    storeId: clientEnv.storeId,
  });

  return new BTCPayClient({
    serverUrl: clientEnv.btcpayUrl,
    apiKey: serverEnv.btcpayApiKey,
    storeId: clientEnv.storeId,
  });
};

export async function getTicket(ticketNumber: string): Promise<Ticket | null> {
  const client = getClient();
  try {
    return await client.getTicket(ticketNumber);
  } catch (error) {
    console.error('Failed to get ticket:', error);
    return null;
  }
}

export async function checkInTicket(
  ticketNumber: string,
  eventId: string
): Promise<CheckInResponse> {
  const client = getClient();
  try {
    return await client.checkInTicket({
      ticketNumber,
      eventId,
      storeId: clientEnv.storeId,
    });
  } catch (error) {
    console.error('Failed to check in ticket:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Check-in failed',
    };
  }
}

export async function getIsUsingMockData(): Promise<boolean> {
  return !serverEnv.btcpayApiKey || clientEnv.useMock;
}