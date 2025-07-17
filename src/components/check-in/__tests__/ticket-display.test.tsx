import { render, screen, fireEvent } from '@testing-library/react';
import { TicketDisplay } from '../ticket-display';
import { Ticket } from '@/types';

describe('TicketDisplay', () => {
  const mockTicket: Ticket = {
    id: '1',
    ticketNumber: 'EVT-0001-241225-12345',
    eventId: 'event-1',
    eventName: 'Bitcoin Conference 2024',
    customerName: 'Satoshi Nakamoto',
    customerEmail: 'satoshi@example.com',
    usedAt: null,
    paymentStatus: 'Paid',
    qrCodeLink: 'https://example.com/qr/test',
    transactionNumber: 'TXN-12345',
  };

  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display ticket information correctly', () => {
    render(<TicketDisplay ticket={mockTicket} />);

    expect(screen.getByText('Ticket Details')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin Conference 2024')).toBeInTheDocument();
    expect(screen.getByText('EVT-0001-241225-12345')).toBeInTheDocument();
    expect(screen.getByText('Satoshi Nakamoto')).toBeInTheDocument();
    expect(screen.getByText('satoshi@example.com')).toBeInTheDocument();
    expect(screen.getByText('TXN-12345')).toBeInTheDocument();
  });

  it('should show Paid badge for paid tickets', () => {
    render(<TicketDisplay ticket={mockTicket} />);
    
    const badge = screen.getByText('Paid');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary');
  });

  it('should show Used badge for used tickets', () => {
    const usedTicket = {
      ...mockTicket,
      usedAt: '2024-12-25T10:00:00Z',
    };
    
    render(<TicketDisplay ticket={usedTicket} />);
    
    const badge = screen.getByText('Used');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary');
  });

  it('should display used at timestamp for used tickets', () => {
    const usedTicket = {
      ...mockTicket,
      usedAt: '2024-12-25T10:00:00Z',
    };
    
    render(<TicketDisplay ticket={usedTicket} />);
    
    expect(screen.getByText('Used at:')).toBeInTheDocument();
    // Check that the date is rendered (format depends on locale)
    const dateElement = screen.getByText('Used at:').parentElement;
    expect(dateElement?.textContent).toContain('2024');
  });

  it('should show success check-in status', () => {
    const checkInStatus = {
      success: true,
      message: 'Check-in successful!',
    };
    
    render(<TicketDisplay ticket={mockTicket} checkInStatus={checkInStatus} />);
    
    expect(screen.getByText('Check-in successful!')).toBeInTheDocument();
    const statusElement = screen.getByText('Check-in successful!').parentElement;
    expect(statusElement).toHaveClass('bg-green-50');
  });

  it('should show error check-in status', () => {
    const checkInStatus = {
      success: false,
      message: 'Ticket already used',
    };
    
    render(<TicketDisplay ticket={mockTicket} checkInStatus={checkInStatus} />);
    
    expect(screen.getByText('Ticket already used')).toBeInTheDocument();
    const statusElement = screen.getByText('Ticket already used').parentElement;
    expect(statusElement).toHaveClass('bg-red-50');
  });

  it('should call onReset when button is clicked', () => {
    render(<TicketDisplay ticket={mockTicket} onReset={mockOnReset} />);
    
    const resetButton = screen.getByText('Scan Another Ticket');
    fireEvent.click(resetButton);
    
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should not show reset button when onReset is not provided', () => {
    render(<TicketDisplay ticket={mockTicket} />);
    
    expect(screen.queryByText('Scan Another Ticket')).not.toBeInTheDocument();
  });

  it('should render QR code', () => {
    render(<TicketDisplay ticket={mockTicket} />);
    
    // QRCode component renders an SVG with the ticket number
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });
});