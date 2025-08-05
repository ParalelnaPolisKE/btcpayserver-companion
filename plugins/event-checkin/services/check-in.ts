import { checkInDB, CheckedInTicket } from '../lib/indexeddb';

export interface Invoice {
  id: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, any>;
  checkoutLink?: string;
  createdTime?: number;
  expirationTime?: number;
  monitoringExpiration?: number;
  additionalStatus?: string;
  availableStatusesForManualMarking?: string[];
}

export interface CheckInResult {
  success: boolean;
  message: string;
  invoice?: Invoice;
  alreadyCheckedIn?: boolean;
  checkedInAt?: Date;
}

class CheckInService {
  private btcpayUrl: string = '';
  private storeId: string = '';
  private apiKey: string = '';

  init(btcpayUrl: string, storeId: string, apiKey?: string) {
    this.btcpayUrl = btcpayUrl;
    this.storeId = storeId;
    this.apiKey = apiKey || '';
  }

  async checkInTicket(ticketId: string, eventId?: string): Promise<CheckInResult> {
    try {
      // Check if already checked in locally
      const existingCheckIn = await checkInDB.getCheckIn(ticketId);
      if (existingCheckIn) {
        return {
          success: false,
          message: 'Ticket already checked in',
          alreadyCheckedIn: true,
          checkedInAt: existingCheckIn.checkedInAt
        };
      }

      // Verify ticket with BTCPay API
      const invoice = await this.getInvoice(ticketId);
      
      if (!invoice) {
        return {
          success: false,
          message: 'Ticket not found'
        };
      }

      // Check if invoice is paid/settled
      if (invoice.status !== 'Settled' && invoice.status !== 'Complete') {
        return {
          success: false,
          message: `Invalid ticket status: ${invoice.status}`,
          invoice
        };
      }

      // Check if already marked as checked in via metadata
      if (invoice.metadata?.checkedInAt) {
        return {
          success: false,
          message: 'Ticket already checked in',
          alreadyCheckedIn: true,
          checkedInAt: new Date(invoice.metadata.checkedInAt),
          invoice
        };
      }

      // Mark as checked in
      const checkedInAt = new Date();
      
      // Store in IndexedDB
      await checkInDB.addCheckIn({
        invoiceId: ticketId,
        orderId: invoice.orderId,
        checkedInAt,
        eventId,
        metadata: invoice.metadata
      });

      // Try to update invoice metadata on server (if we have API key)
      if (this.apiKey) {
        try {
          await this.updateInvoiceMetadata(ticketId, {
            ...invoice.metadata,
            checkedInAt: checkedInAt.toISOString(),
            checkedInBy: 'event-checkin-plugin'
          });
        } catch (error) {
          console.warn('Failed to update server metadata:', error);
        }
      }

      return {
        success: true,
        message: 'Check-in successful',
        invoice,
        checkedInAt
      };
    } catch (error) {
      console.error('Check-in error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Check-in failed'
      };
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const url = `${this.btcpayUrl}/api/v1/stores/${this.storeId}/invoices/${invoiceId}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `token ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch invoice: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  async updateInvoiceMetadata(invoiceId: string, metadata: Record<string, any>): Promise<void> {
    const url = `${this.btcpayUrl}/api/v1/stores/${this.storeId}/invoices/${invoiceId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${this.apiKey}`
      },
      body: JSON.stringify({ metadata })
    });

    if (!response.ok) {
      throw new Error(`Failed to update invoice: ${response.statusText}`);
    }
  }

  async undoCheckIn(ticketId: string): Promise<CheckInResult> {
    try {
      await checkInDB.removeCheckIn(ticketId);
      
      // Try to update server metadata if we have API key
      if (this.apiKey) {
        try {
          const invoice = await this.getInvoice(ticketId);
          if (invoice && invoice.metadata?.checkedInAt) {
            const { checkedInAt, checkedInBy, ...restMetadata } = invoice.metadata;
            await this.updateInvoiceMetadata(ticketId, restMetadata);
          }
        } catch (error) {
          console.warn('Failed to update server metadata:', error);
        }
      }

      return {
        success: true,
        message: 'Check-in undone successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to undo check-in'
      };
    }
  }

  async getCheckInStats(eventId?: string) {
    return checkInDB.getStats(eventId);
  }

  async getAllCheckIns(eventId?: string) {
    return checkInDB.getAllCheckIns(eventId);
  }

  async clearAllCheckIns() {
    return checkInDB.clearAllCheckIns();
  }
}

export const checkInService = new CheckInService();