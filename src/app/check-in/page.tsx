import { getIsUsingMockData } from '@/app/actions/check-in';
import CheckInClient from './check-in-client';

export default async function CheckInPage() {
  const isUsingMockData = await getIsUsingMockData();
  
  return <CheckInClient isUsingMockData={isUsingMockData} />;
}