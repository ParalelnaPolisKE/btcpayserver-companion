import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { Ticket, Event, CheckInRequest, CheckInResponse, BTCPayConfig } from '@/types';

// Validation schemas
const ticketSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  usedAt: z.string().nullable().optional(),
  paymentStatus: z.enum(['Pending', 'Paid', 'Failed']),
  qrCodeLink: z.string().optional(),
  transactionNumber: z.string().optional(),
});

export class BTCPayClient {
  private client: AxiosInstance;
  private storeId: string;

  constructor(config: BTCPayConfig) {
    this.storeId = config.storeId;
    this.client = axios.create({
      baseURL: config.serverUrl,
      headers: {
        'Authorization': `token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log('BTCPay API Request:', {
          url: config.url,
          method: config.method,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization ? 
              `token ${config.headers.Authorization.substring(6, 10)}...` : 'none'
          },
        });
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch ticket information by ticket number
   */
  async getTicket(ticketNumber: string): Promise<Ticket | null> {
    try {
      // First, try to get it as an invoice ID (fallback approach)
      console.log(`Attempting to fetch invoice: ${ticketNumber} from store: ${this.storeId}`);
      
      try {
        const invoiceResponse = await this.client.get(`/api/v1/stores/${this.storeId}/invoices/${ticketNumber}`);
        console.log('Invoice found:', invoiceResponse.data);
        
        // Convert invoice data to ticket format
        const invoice = invoiceResponse.data;
        return {
          id: invoice.id,
          ticketNumber: invoice.id,
          eventId: 'event-1', // Would need to be extracted from metadata
          eventName: invoice.metadata?.itemDesc || 'Event Ticket',
          customerName: invoice.buyer?.name || 'Unknown',
          customerEmail: invoice.buyer?.email || 'unknown@example.com',
          usedAt: invoice.metadata?.checkedInAt || null,
          paymentStatus: invoice.status === 'Settled' ? 'Paid' : invoice.status === 'New' ? 'Pending' : 'Failed',
          transactionNumber: invoice.id,
        };
      } catch (invoiceError) {
        console.log('Not found as invoice, trying plugin endpoint...');
      }
      
      // Try the plugin endpoint
      const response = await this.client.get(`/api/v1/stores/${this.storeId}/plugins/satoshitickets/tickets/${ticketNumber}`);
      const validated = ticketSchema.parse(response.data);
      return validated;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('BTCPay API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        if (error.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Validate and check in a ticket
   */
  async checkInTicket(request: CheckInRequest): Promise<CheckInResponse> {
    try {
      // First try the plugin endpoint
      try {
        const response = await this.client.post(
          `/api/v1/stores/${this.storeId}/plugins/satoshitickets/checkin`,
          {
            ticketNumber: request.ticketNumber,
            eventId: request.eventId,
          }
        );

        return {
          success: response.data.success,
          message: response.data.message,
          ticket: response.data.ticket ? ticketSchema.parse(response.data.ticket) : undefined,
        };
      } catch (pluginError) {
        console.log('Plugin endpoint not available, using invoice metadata approach...');
      }

      // Fallback: Update invoice metadata to mark as checked in
      const ticket = await this.getTicket(request.ticketNumber);
      if (!ticket) {
        return {
          success: false,
          message: 'Ticket not found',
        };
      }

      if (ticket.usedAt) {
        return {
          success: false,
          message: `Ticket was already used at ${new Date(ticket.usedAt).toLocaleString()}`,
        };
      }

      if (ticket.paymentStatus !== 'Paid') {
        return {
          success: false,
          message: 'Ticket payment is not confirmed',
        };
      }

      // Update invoice metadata to mark as checked in
      try {
        await this.client.put(
          `/api/v1/stores/${this.storeId}/invoices/${request.ticketNumber}`,
          {
            metadata: {
              checkedInAt: new Date().toISOString(),
              checkedInBy: 'companion-app',
            },
          }
        );

        return {
          success: true,
          message: 'Check-in successful!',
          ticket: {
            ...ticket,
            usedAt: new Date().toISOString(),
          },
        };
      } catch (updateError) {
        console.error('Failed to update invoice metadata:', updateError);
        return {
          success: false,
          message: 'Check-in failed - unable to update ticket status',
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to check in ticket';
        return {
          success: false,
          message,
        };
      }
      throw error;
    }
  }

  /**
   * Get event details
   */
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const response = await this.client.get(`/api/v1/stores/${this.storeId}/plugins/satoshitickets/events/${eventId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all events for the store
   */
  async getEvents(): Promise<Event[]> {
    try {
      const response = await this.client.get(`/api/v1/stores/${this.storeId}/plugins/satoshitickets/events`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to fetch events:', error.message);
        return [];
      }
      throw error;
    }
  }

  /**
   * Verify the API connection and permissions
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const response = await this.client.get(`/api/v1/stores/${this.storeId}`);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to verify BTCPay connection:', error);
      return false;
    }
  }

  /**
   * Get invoices for analytics with pagination
   */
  async getInvoices(params?: {
    skip?: number;
    take?: number;
    startDate?: string | number;
    endDate?: string | number;
    status?: string[];
    searchTerm?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.take) queryParams.append('take', params.take.toString());
      
      // Convert dates to Unix timestamps if they're ISO strings
      if (params?.startDate) {
        const timestamp = typeof params.startDate === 'string' 
          ? Math.floor(new Date(params.startDate).getTime() / 1000)
          : params.startDate;
        queryParams.append('startDate', timestamp.toString());
      }
      if (params?.endDate) {
        const timestamp = typeof params.endDate === 'string'
          ? Math.floor(new Date(params.endDate).getTime() / 1000)
          : params.endDate;
        queryParams.append('endDate', timestamp.toString());
      }
      
      if (params?.status) {
        params.status.forEach(s => queryParams.append('status', s));
      }
      if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);

      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to fetch invoices:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
      }
      console.error('Failed to fetch invoices:', error);
      throw error;
    }
  }

  /**
   * Get store information including supported payment methods
   */
  async getStoreInfo() {
    try {
      const response = await this.client.get(`/api/v1/stores/${this.storeId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch store info:', error);
      throw error;
    }
  }

  /**
   * Get payment methods for the store
   */
  async getPaymentMethods() {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/payment-methods`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      throw error;
    }
  }

  /**
   * Get invoice details by ID
   */
  async getInvoiceById(invoiceId: string) {
    try {
      const response = await this.client.get(
        `/api/v1/stores/${this.storeId}/invoices/${invoiceId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
      throw error;
    }
  }
}