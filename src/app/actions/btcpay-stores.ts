'use server';

import { BTCPayClient } from '@/services/btcpay-client';
import { BTCPayMockClient } from '@/services/btcpay-mock';
import { serverEnv, clientEnv } from '@/lib/env';

export async function getAvailableStores() {
  try {
    const apiKey = serverEnv.btcpayApiKey;
    const serverUrl = process.env.NEXT_PUBLIC_BTCPAY_URL || 'https://btcpay.example.com';
    const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'store-1';
    
    const config = {
      serverUrl,
      apiKey: apiKey || '',
      storeId,
    };
    
    // Use mock client if no API key or mock mode is forced
    const ClientClass = (!apiKey || clientEnv.useMock) ? BTCPayMockClient : BTCPayClient;
    const client = new ClientClass(config);
    
    const stores = await client.getAvailableStores();
    
    return {
      success: true,
      stores: stores.filter(store => !store.archived), // Filter out archived stores
      isUsingMockData: !apiKey || clientEnv.useMock,
    };
  } catch (error) {
    console.error('Failed to fetch available stores:', error);
    return {
      success: false,
      stores: [],
      error: error instanceof Error ? error.message : 'Failed to fetch stores',
      isUsingMockData: true,
    };
  }
}

export async function getStorePOSApps(storeId: string) {
  try {
    const apiKey = serverEnv.btcpayApiKey;
    const serverUrl = process.env.NEXT_PUBLIC_BTCPAY_URL || 'https://btcpay.example.com';
    
    const config = {
      serverUrl,
      apiKey: apiKey || '',
      storeId,
    };
    
    // Use mock client if no API key or mock mode is forced
    const ClientClass = (!apiKey || clientEnv.useMock) ? BTCPayMockClient : BTCPayClient;
    const client = new ClientClass(config);
    
    const posApps = await client.getStorePOSApps(storeId);
    
    return {
      success: true,
      posApps,
      isUsingMockData: !apiKey || clientEnv.useMock,
    };
  } catch (error) {
    console.error('Failed to fetch POS apps:', error);
    return {
      success: false,
      posApps: [],
      error: error instanceof Error ? error.message : 'Failed to fetch POS apps',
      isUsingMockData: true,
    };
  }
}