'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Ticket, CheckInResponse } from '@/types';
import { getTicket, checkInTicket } from '@/app/actions/check-in';

interface UseCheckInConfig {
  eventId: string;
}

export function useCheckIn(config: UseCheckInConfig) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInResponse | null>(null);

  // Mutation for fetching ticket details
  const fetchTicketMutation = useMutation({
    mutationFn: async (ticketNumber: string) => {
      const fetchedTicket = await getTicket(ticketNumber);
      if (!fetchedTicket) {
        throw new Error('Ticket not found');
      }
      return fetchedTicket;
    },
    onSuccess: (data) => {
      setTicket(data);
      setCheckInStatus(null);
    },
    onError: (error) => {
      setCheckInStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch ticket',
      });
    },
  });

  // Mutation for checking in a ticket
  const checkInMutation = useMutation({
    mutationFn: async (ticketNumber: string) => {
      return await checkInTicket(ticketNumber, config.eventId);
    },
    onSuccess: (response) => {
      setCheckInStatus(response);
      if (response.success && response.ticket) {
        setTicket(response.ticket);
      }
    },
    onError: (error) => {
      setCheckInStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Check-in failed',
      });
    },
  });

  const handleTicketScan = useCallback(async (ticketNumber: string) => {
    // First fetch the ticket to display its details
    await fetchTicketMutation.mutateAsync(ticketNumber);
    
    // Then attempt to check it in
    await checkInMutation.mutateAsync(ticketNumber);
  }, [fetchTicketMutation, checkInMutation]);

  const reset = useCallback(() => {
    setTicket(null);
    setCheckInStatus(null);
  }, []);

  return {
    ticket,
    checkInStatus,
    isLoading: fetchTicketMutation.isPending || checkInMutation.isPending,
    handleTicketScan,
    reset,
  };
}