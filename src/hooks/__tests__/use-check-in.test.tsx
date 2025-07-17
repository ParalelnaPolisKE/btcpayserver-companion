import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckIn } from '../use-check-in-server';
import React from 'react';

// Mock the server actions
jest.mock('@/app/actions/check-in', () => ({
  getTicket: jest.fn(),
  checkInTicket: jest.fn(),
}));

import { getTicket, checkInTicket } from '@/app/actions/check-in';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCheckIn', () => {
  const mockGetTicket = getTicket as jest.MockedFunction<typeof getTicket>;
  const mockCheckInTicket = checkInTicket as jest.MockedFunction<typeof checkInTicket>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const config = {
    eventId: 'event-1',
  };

  it('should handle successful ticket scan and check-in', async () => {
    const mockTicket = {
      id: '1',
      ticketNumber: 'EVT-0001-241225-12345',
      eventId: 'event-1',
      eventName: 'Test Event',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      usedAt: null,
      paymentStatus: 'Paid' as const,
    };

    const mockCheckInResponse = {
      success: true,
      message: 'Check-in successful!',
      ticket: { ...mockTicket, usedAt: new Date().toISOString() },
    };

    mockGetTicket.mockResolvedValueOnce(mockTicket);
    mockCheckInTicket.mockResolvedValueOnce(mockCheckInResponse);

    const { result } = renderHook(() => useCheckIn(config), {
      wrapper: createWrapper(),
    });

    expect(result.current.ticket).toBeNull();
    expect(result.current.checkInStatus).toBeNull();
    expect(result.current.isLoading).toBe(false);

    // Trigger ticket scan
    await act(async () => {
      await act(async () => {
      await result.current.handleTicketScan('EVT-0001-241225-12345');
    });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetTicket).toHaveBeenCalledWith('EVT-0001-241225-12345');
    expect(mockCheckInTicket).toHaveBeenCalledWith('EVT-0001-241225-12345', 'event-1');

    expect(result.current.ticket).toEqual(mockCheckInResponse.ticket);
    expect(result.current.checkInStatus).toEqual(mockCheckInResponse);
  });

  it('should handle ticket not found error', async () => {
    mockGetTicket.mockRejectedValueOnce(new Error('Ticket not found'));

    const { result } = renderHook(() => useCheckIn(config), {
      wrapper: createWrapper(),
    });

    // Trigger ticket scan
    await act(async () => {
      await expect(result.current.handleTicketScan('invalid-ticket')).rejects.toThrow('Ticket not found');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.checkInStatus).toEqual({
      success: false,
      message: 'Ticket not found',
    });
  });

  it('should handle already used ticket', async () => {
    const mockTicket = {
      id: '1',
      ticketNumber: 'EVT-0001-241225-12345',
      eventId: 'event-1',
      eventName: 'Test Event',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      usedAt: '2024-12-25T10:00:00Z',
      paymentStatus: 'Paid' as const,
    };

    const mockCheckInResponse = {
      success: false,
      message: 'Ticket was already used',
    };

    mockGetTicket.mockResolvedValueOnce(mockTicket);
    mockCheckInTicket.mockResolvedValueOnce(mockCheckInResponse);

    const { result } = renderHook(() => useCheckIn(config), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleTicketScan('EVT-0001-241225-12345');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.ticket).toEqual(mockTicket);
    expect(result.current.checkInStatus).toEqual(mockCheckInResponse);
  });

  it('should reset state correctly', async () => {
    const mockTicket = {
      id: '1',
      ticketNumber: 'EVT-0001-241225-12345',
      eventId: 'event-1',
      eventName: 'Test Event',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      usedAt: null,
      paymentStatus: 'Paid' as const,
    };

    mockGetTicket.mockResolvedValueOnce(mockTicket);
    mockCheckInTicket.mockResolvedValueOnce({
      success: true,
      message: 'Check-in successful!',
      ticket: mockTicket,
    });

    const { result } = renderHook(() => useCheckIn(config), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleTicketScan('EVT-0001-241225-12345');
    });

    await waitFor(() => {
      expect(result.current.ticket).toBeTruthy();
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.ticket).toBeNull();
    expect(result.current.checkInStatus).toBeNull();
  });
});