'use client';

import CheckInClient from './check-in-client';
import { config as appConfig } from '@/lib/config';

export default function CheckInPage() {
  // Determine if using mock data on client side
  const apiKey = typeof window !== 'undefined' 
    ? localStorage.getItem('btcpay_api_key') || process.env.NEXT_PUBLIC_BTCPAY_API_KEY || ''
    : process.env.NEXT_PUBLIC_BTCPAY_API_KEY || '';
  const isUsingMockData = !apiKey || appConfig.app.useMockData;
  
  return <CheckInClient isUsingMockData={isUsingMockData} />;
}