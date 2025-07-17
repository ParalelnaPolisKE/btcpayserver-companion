export interface Ticket {
  id: string;
  ticketNumber: string;
  eventId: string;
  eventName: string;
  customerName: string;
  customerEmail: string;
  usedAt?: string | null;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  qrCodeLink?: string;
  transactionNumber?: string;
}

export interface Event {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  ticketTiers?: TicketTier[];
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  available: number;
}

export interface CheckInRequest {
  ticketNumber: string;
  eventId: string;
  storeId: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  ticket?: Ticket;
}

export interface BTCPayConfig {
  serverUrl: string;
  apiKey: string;
  storeId: string;
}

export interface ValidationError {
  field: string;
  message: string;
}