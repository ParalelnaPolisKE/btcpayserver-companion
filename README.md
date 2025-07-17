# BTCPay Companion - Event Check-in Service

A companion web application for BTCPayServer's SatoshiTickets plugin that provides a streamlined check-in interface for event staff who don't have direct access to BTCPayServer.

## Features

- **QR Code Scanning**: Quick check-in by scanning ticket QR codes using device camera
- **Manual Entry**: Option to manually enter ticket numbers for check-in
- **Real-time Validation**: Instant ticket validation with clear success/error messages
- **Ticket Details Display**: Shows attendee information and ticket status
- **Mock Mode**: Includes mock implementation for development and testing

## Architecture

The application is built using:
- **Next.js 15** with App Router and React Server Components
- **TypeScript** for type safety
- **TailwindCSS** and **shadcn/ui** for modern, accessible UI components
- **React Query** for efficient data fetching and caching
- **html5-qrcode** for QR code scanning functionality
- **Jest** and **React Testing Library** for comprehensive testing

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── check-in/          # Check-in page
│   └── providers.tsx      # React Query provider setup
├── components/            # React components
│   └── check-in/         # Check-in specific components
│       ├── qr-scanner.tsx
│       ├── manual-input.tsx
│       └── ticket-display.tsx
├── services/             # API client services
│   ├── btcpay-client.ts # BTCPayServer API client
│   └── btcpay-mock.ts   # Mock implementation
├── hooks/               # Custom React hooks
│   └── use-check-in.ts  # Check-in logic hook
└── types/               # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- BTCPayServer instance with SatoshiTickets plugin (for production)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd bps-companion

# Install dependencies
bun install
# or
npm install
```

### Development

```bash
# Run development server
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Testing

```bash
# Run all tests
npx jest
# or
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Configuration

The application uses mock data by default. To connect to a real BTCPayServer instance:

1. Copy `.env.example` to `.env.local`
2. Set the appropriate environment variables:
   - `BTCPAYSERVER_API_KEY`: API key with appropriate permissions (required)
   - `NEXT_PUBLIC_BTCPAY_URL`: Your BTCPayServer URL
   - `NEXT_PUBLIC_STORE_ID`: Your store ID
   - `NEXT_PUBLIC_EVENT_ID`: The event ID for check-ins
   - `NEXT_PUBLIC_USE_MOCK`: Set to 'true' to force mock mode

The app automatically switches between mock and real API based on the presence of `BTCPAYSERVER_API_KEY`.

## API Integration

The application expects the SatoshiTickets plugin to expose these endpoints:

- `GET /api/v1/stores/{storeId}/plugins/satoshitickets/tickets/{ticketNumber}`
- `POST /api/v1/stores/{storeId}/plugins/satoshitickets/checkin`
- `GET /api/v1/stores/{storeId}/plugins/satoshitickets/events/{eventId}`
- `GET /api/v1/stores/{storeId}/plugins/satoshitickets/events`

Note: These endpoints may need to be implemented in the SatoshiTickets plugin or exposed through a custom API layer.

## Usage

1. Navigate to the Check-in page from the home screen
2. Choose between QR scanning or manual entry:
   - **QR Scan**: Allow camera access and position the ticket QR code in the frame
   - **Manual Entry**: Type the ticket number (e.g., EVT-0001-241225-12345)
3. The system will validate the ticket and display the result
4. Successfully checked-in tickets are marked as used and cannot be checked in again

## Mock Data

The mock implementation includes sample tickets for testing:
- `EVT-0001-241225-12345` - Valid, unused ticket
- `EVT-0001-241225-23456` - Already used ticket
- `EVT-0001-241225-34567` - Pending payment ticket

## Future Enhancements

- Event selection and management
- Attendee reports and statistics
- Offline mode with sync capabilities
- Multi-language support
- Dark mode theme
- Export functionality for attendee lists

## License

This project is licensed under the MIT License.