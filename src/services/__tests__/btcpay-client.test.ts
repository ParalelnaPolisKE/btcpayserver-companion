import axios from 'axios';
import { BTCPayClient } from '../btcpay-client';
import { BTCPayConfig, Ticket, CheckInRequest } from '@/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BTCPayClient', () => {
  let client: BTCPayClient;
  let mockAxiosInstance: any;
  
  const config: BTCPayConfig = {
    serverUrl: 'https://btcpay.example.com',
    apiKey: 'test-api-key',
    storeId: 'test-store-id',
  };

  const mockTicket: Ticket = {
    id: '1',
    ticketNumber: 'EVT-0001-241225-12345',
    eventId: 'event-1',
    eventName: 'Test Event',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    usedAt: null,
    paymentStatus: 'Paid',
    qrCodeLink: 'https://example.com/qr/test',
    transactionNumber: 'TXN-12345',
  };

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    mockedAxios.isAxiosError = jest.fn(() => false) as any;
    
    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    client = new BTCPayClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getTicket', () => {
    it('should fetch a ticket from plugin endpoint successfully', async () => {
      // Invoice endpoint fails
      const invoiceError = {
        isAxiosError: true,
        response: { status: 404 },
      };
      mockAxiosInstance.get
        .mockRejectedValueOnce(invoiceError) // Invoice endpoint fails
        .mockResolvedValueOnce({ data: mockTicket }); // Plugin endpoint succeeds
      
      const result = await client.getTicket('EVT-0001-241225-12345');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}/invoices/EVT-0001-241225-12345`
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}/plugins/satoshitickets/tickets/EVT-0001-241225-12345`
      );
      expect(result).toEqual(mockTicket);
    });

    it('should fetch a ticket from invoice endpoint as fallback', async () => {
      const mockInvoice = {
        id: 'INV123',
        status: 'Settled',
        metadata: {
          itemDesc: 'Concert Ticket',
          checkedInAt: null,
        },
        buyer: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockInvoice });
      
      const result = await client.getTicket('INV123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}/invoices/INV123`
      );
      expect(result).toEqual({
        id: 'INV123',
        ticketNumber: 'INV123',
        eventId: 'event-1',
        eventName: 'Concert Ticket',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        usedAt: null,
        paymentStatus: 'Paid',
        transactionNumber: 'INV123',
      });
    });

    it('should return null when ticket is not found', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 404 },
      };
      mockAxiosInstance.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await client.getTicket('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(client.getTicket('test')).rejects.toThrow('Network error');
    });
  });

  describe('checkInTicket', () => {
    const checkInRequest: CheckInRequest = {
      ticketNumber: 'EVT-0001-241225-12345',
      eventId: 'event-1',
      storeId: 'test-store-id',
    };

    it('should check in a ticket via plugin endpoint successfully', async () => {
      const successResponse = {
        data: {
          success: true,
          message: 'Check-in successful!',
          ticket: { ...mockTicket, usedAt: new Date().toISOString() },
        },
      };
      mockAxiosInstance.post.mockResolvedValueOnce(successResponse);

      const result = await client.checkInTicket(checkInRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}/plugins/satoshitickets/checkin`,
        {
          ticketNumber: checkInRequest.ticketNumber,
          eventId: checkInRequest.eventId,
        }
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Check-in successful!');
      expect(result.ticket).toBeDefined();
    });

    it('should check in a ticket via invoice fallback when plugin fails', async () => {
      // Plugin endpoint fails
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Plugin not found'));
      
      // getTicket returns a valid ticket
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: 'INV123',
          status: 'Settled',
          metadata: {},
          buyer: { name: 'John Doe', email: 'john@example.com' },
        },
      });
      
      // Update invoice succeeds
      mockAxiosInstance.put.mockResolvedValueOnce({ data: {} });

      const result = await client.checkInTicket(checkInRequest);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        `/api/v1/stores/${config.storeId}/invoices/${checkInRequest.ticketNumber}`,
        {
          metadata: {
            checkedInAt: expect.any(String),
            checkedInBy: 'companion-app',
          },
        }
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Check-in successful!');
    });

    it('should handle already checked-in ticket', async () => {
      // Plugin endpoint fails
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Plugin not found'));
      
      // getTicket returns an already used ticket
      const usedTicket = { ...mockTicket, usedAt: '2024-01-01T10:00:00Z' };
      mockAxiosInstance.get
        .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
        .mockResolvedValueOnce({ data: usedTicket });

      const result = await client.checkInTicket(checkInRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Ticket was already used');
    });

    it('should handle unpaid ticket', async () => {
      // Plugin endpoint fails
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Plugin not found'));
      
      // getTicket returns an unpaid ticket
      const unpaidTicket = { ...mockTicket, paymentStatus: 'Pending' as const };
      mockAxiosInstance.get
        .mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
        .mockResolvedValueOnce({ data: unpaidTicket });

      const result = await client.checkInTicket(checkInRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Ticket payment is not confirmed');
    });

    it('should handle network errors', async () => {
      const error = {
        isAxiosError: true,
        response: { data: { message: 'Network error' } },
      };
      mockAxiosInstance.post.mockRejectedValueOnce(error);
      mockAxiosInstance.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await client.checkInTicket(checkInRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to check in ticket');
    });
  });

  describe('verifyConnection', () => {
    it('should return true when connection is successful', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ status: 200 });

      const result = await client.verifyConnection();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/api/v1/stores/${config.storeId}`);
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.verifyConnection();

      expect(result).toBe(false);
    });
  });
});