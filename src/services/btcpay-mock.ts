import { Ticket, Event, CheckInRequest, CheckInResponse, BTCPayConfig } from '@/types';
import { startOfMonth, subMonths, addDays, format } from 'date-fns';
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

  async getInvoices(params?: {
    skip?: number;
    take?: number;
    startDate?: string;
    endDate?: string;
    status?: string[];
    searchTerm?: string;
  }) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Generate mock invoices for the last 6 months
    const invoices = [];
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);
    
    // Generate 150 invoices over 6 months
    for (let i = 0; i < 150; i++) {
      const createdDate = addDays(sixMonthsAgo, Math.random() * 180);
      const amount = Math.floor(Math.random() * 5000) + 100; // $1 to $50
      const status = Math.random() > 0.9 ? 'Expired' : Math.random() > 0.85 ? 'Invalid' : 'Settled';
      
      const invoice = {
        id: `inv_${i + 1}`,
        storeId: this.storeId,
        amount: (amount / 100).toFixed(2), // Convert to dollars as string
        paidAmount: status === 'Settled' ? (amount / 100).toFixed(2) : '0.00',
        currency: 'USD',
        status, // API returns capitalized status
        createdTime: Math.floor(createdDate.getTime() / 1000), // Unix timestamp
        expirationTime: Math.floor(addDays(createdDate, 1).getTime() / 1000),
        monitoringExpiration: Math.floor(addDays(createdDate, 2).getTime() / 1000),
        metadata: {
          orderId: `order_${i + 1}`,
          itemDesc: this.getRandomProduct(),
          buyer: {
            name: this.getRandomCustomer(),
            email: `customer${i + 1}@example.com`,
          },
        },
        checkout: {
          speedPolicy: 'MediumSpeed',
          paymentMethods: [this.getRandomPaymentMethod()],
        },
      };
      
      invoices.push(invoice);
    }

    // Sort by created date descending
    invoices.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

    // Apply filters
    let filtered = invoices;
    
    if (params?.status && params.status.length > 0) {
      filtered = filtered.filter(inv => params.status!.includes(inv.status));
    }
    
    if (params?.startDate) {
      const startTimestamp = typeof params.startDate === 'string' 
        ? Math.floor(new Date(params.startDate).getTime() / 1000)
        : params.startDate;
      filtered = filtered.filter(inv => inv.createdTime >= startTimestamp);
    }
    
    if (params?.endDate) {
      const endTimestamp = typeof params.endDate === 'string'
        ? Math.floor(new Date(params.endDate).getTime() / 1000) 
        : params.endDate;
      filtered = filtered.filter(inv => inv.createdTime <= endTimestamp);
    }
    
    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.id.toLowerCase().includes(term) ||
        inv.metadata.itemDesc.toLowerCase().includes(term) ||
        inv.metadata.buyer.name.toLowerCase().includes(term)
      );
    }

    // Apply pagination
    const skip = params?.skip || 0;
    const take = params?.take || 50;
    const paginated = filtered.slice(skip, skip + take);

    return paginated;
  }

  async getStoreInfo() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      id: this.storeId,
      name: 'Demo Store',
      website: 'https://demo-store.example.com',
      invoiceExpiration: 900,
      monitoringExpiration: 3600,
      speedPolicy: 'MediumSpeed',
      defaultCurrency: 'USD',
      supportedPaymentMethods: ['BTC', 'LTC', 'ETH'],
    };
  }

  async getPaymentMethods() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        enabled: true,
        cryptoCode: 'BTC',
        name: 'Bitcoin',
        paymentMethod: 'BTC-OnChain',
      },
      {
        enabled: true,
        cryptoCode: 'BTC',
        name: 'Bitcoin (Lightning)',
        paymentMethod: 'BTC-LightningNetwork',
      },
      {
        enabled: true,
        cryptoCode: 'LTC',
        name: 'Litecoin',
        paymentMethod: 'LTC-OnChain',
      },
    ];
  }

  async getInvoiceById(invoiceId: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return a detailed mock invoice
    return {
      id: invoiceId,
      storeId: this.storeId,
      amount: 25.00,
      currency: 'USD',
      status: 'Settled',
      createdTime: new Date().toISOString(),
      expirationTime: addDays(new Date(), 1).toISOString(),
      metadata: {
        orderId: 'order_123',
        itemDesc: 'Premium Subscription',
        buyer: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      checkout: {
        speedPolicy: 'MediumSpeed',
        paymentMethods: ['BTC-OnChain', 'BTC-LightningNetwork'],
      },
      receipt: {
        enabled: true,
        showPayments: true,
        showQR: true,
      },
    };
  }

  private getRandomProduct(): string {
    const products = [
      'Premium Subscription',
      'Basic Plan',
      'Enterprise License',
      'API Access',
      'Support Package',
      'Consulting Hours',
      'Training Session',
      'Custom Integration',
      'Data Export',
      'Priority Support',
    ];
    return products[Math.floor(Math.random() * products.length)];
  }

  private getRandomCustomer(): string {
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Tom', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  private getRandomPaymentMethod(): string {
    const methods = ['BTC-OnChain', 'BTC-LightningNetwork', 'LTC-OnChain'];
    return methods[Math.floor(Math.random() * methods.length)];
  }
}