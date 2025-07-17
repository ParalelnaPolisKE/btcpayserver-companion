import { Ticket, Event, CheckInRequest, CheckInResponse, BTCPayConfig } from '@/types';
import { BTCPayClient } from './btcpay-client';

// Mock data
const mockTickets: Record<string, Ticket> = {
  'EVT-0001-241225-12345': {
    id: '1',
    ticketNumber: 'EVT-0001-241225-12345',
    eventId: 'event-1',
    eventName: 'Bitcoin Conference 2024',
    customerName: 'Satoshi Nakamoto',
    customerEmail: 'satoshi@example.com',
    usedAt: null,
    paymentStatus: 'Paid',
    qrCodeLink: 'https://example.com/qr/EVT-0001-241225-12345',
    transactionNumber: 'TXN-12345',
  },
  'EVT-0001-241225-23456': {
    id: '2',
    ticketNumber: 'EVT-0001-241225-23456',
    eventId: 'event-1',
    eventName: 'Bitcoin Conference 2024',
    customerName: 'Hal Finney',
    customerEmail: 'hal@example.com',
    usedAt: '2024-12-25T10:30:00Z',
    paymentStatus: 'Paid',
    qrCodeLink: 'https://example.com/qr/EVT-0001-241225-23456',
    transactionNumber: 'TXN-23456',
  },
  'EVT-0001-241225-34567': {
    id: '3',
    ticketNumber: 'EVT-0001-241225-34567',
    eventId: 'event-1',
    eventName: 'Bitcoin Conference 2024',
    customerName: 'Nick Szabo',
    customerEmail: 'nick@example.com',
    usedAt: null,
    paymentStatus: 'Pending',
    qrCodeLink: 'https://example.com/qr/EVT-0001-241225-34567',
    transactionNumber: 'TXN-34567',
  },
};

const mockEvents: Record<string, Event> = {
  'event-1': {
    id: 'event-1',
    storeId: 'store-1',
    name: 'Bitcoin Conference 2024',
    description: 'The premier Bitcoin conference of the year',
    startDate: '2024-12-25T09:00:00Z',
    endDate: '2024-12-27T18:00:00Z',
    location: 'Miami, FL',
    ticketTiers: [
      {
        id: 'tier-1',
        name: 'General Admission',
        price: 0.001,
        currency: 'BTC',
        quantity: 100,
        available: 50,
      },
      {
        id: 'tier-2',
        name: 'VIP',
        price: 0.005,
        currency: 'BTC',
        quantity: 20,
        available: 5,
      },
    ],
  },
};

export class BTCPayMockClient extends BTCPayClient {
  constructor(config: BTCPayConfig) {
    super(config);
  }

  async getTicket(ticketNumber: string): Promise<Ticket | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTickets[ticketNumber] || null;
  }

  async checkInTicket(request: CheckInRequest): Promise<CheckInResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const ticket = mockTickets[request.ticketNumber];

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket not found',
      };
    }

    if (ticket.eventId !== request.eventId) {
      return {
        success: false,
        message: 'Ticket is not valid for this event',
      };
    }

    if (ticket.paymentStatus !== 'Paid') {
      return {
        success: false,
        message: 'Ticket payment is not confirmed',
      };
    }

    if (ticket.usedAt) {
      return {
        success: false,
        message: `Ticket was already used at ${new Date(ticket.usedAt).toLocaleString()}`,
      };
    }

    // Mark ticket as used
    const updatedTicket = {
      ...ticket,
      usedAt: new Date().toISOString(),
    };
    mockTickets[request.ticketNumber] = updatedTicket;

    return {
      success: true,
      message: 'Check-in successful!',
      ticket: updatedTicket,
    };
  }

  async getEvent(eventId: string): Promise<Event | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockEvents[eventId] || null;
  }

  async getEvents(): Promise<Event[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return Object.values(mockEvents);
  }

  async verifyConnection(): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
}