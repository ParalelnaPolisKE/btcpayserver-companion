import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualInput } from '../manual-input';

describe('ManualInput', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the manual input form', () => {
    render(<ManualInput onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Manual Check-in')).toBeInTheDocument();
    expect(screen.getByText('Enter the ticket number to check in manually')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('EVT-0001-241225-12345')).toBeInTheDocument();
    expect(screen.getByText('Check In')).toBeInTheDocument();
  });

  it('should call onSubmit with trimmed ticket number', async () => {
    const user = userEvent.setup();
    render(<ManualInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('EVT-0001-241225-12345');
    const button = screen.getByText('Check In');

    await user.type(input, '  EVT-0001-241225-12345  ');
    await user.click(button);

    expect(mockOnSubmit).toHaveBeenCalledWith('EVT-0001-241225-12345');
  });

  it('should submit on form submission', async () => {
    const user = userEvent.setup();
    render(<ManualInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('EVT-0001-241225-12345');

    await user.type(input, 'EVT-0001-241225-12345{enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('EVT-0001-241225-12345');
  });

  it('should disable button when input is empty', () => {
    render(<ManualInput onSubmit={mockOnSubmit} />);

    const button = screen.getByText('Check In');
    expect(button).toBeDisabled();
  });

  it('should enable button when input has value', async () => {
    const user = userEvent.setup();
    render(<ManualInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('EVT-0001-241225-12345');
    const button = screen.getByText('Check In');

    expect(button).toBeDisabled();

    await user.type(input, 'EVT-0001');

    expect(button).not.toBeDisabled();
  });

  it('should disable input and button when loading', () => {
    render(<ManualInput onSubmit={mockOnSubmit} isLoading={true} />);

    const input = screen.getByPlaceholderText('EVT-0001-241225-12345');
    const button = screen.getByText('Check In');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should not submit empty or whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<ManualInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('EVT-0001-241225-12345');
    const button = screen.getByText('Check In');

    // Try with empty input
    await user.click(button);
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Try with whitespace only
    await user.type(input, '   ');
    await user.click(button);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});