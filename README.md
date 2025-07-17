# BTCPay Companion

A comprehensive financial dashboard and event check-in service for BTCPayServer. This companion app provides real-time analytics, financial metrics, and seamless event management integration with the SatoshiTickets plugin.

## Features

### 📊 Financial Dashboard
- **Monthly Recurring Revenue (MRR)** tracking with growth rates
- **Revenue trends** visualization over the last 6 months
- **Revenue projections** using linear regression analysis
- **Invoice status breakdown** with visual charts
- **Payment method analytics** to understand customer preferences
- **Top products** report showing best-selling items
- **Average transaction value** calculations
- **Conversion rate** metrics

### 🎫 Event Check-in
- **QR code scanning** for quick attendee check-ins
- **Manual ticket entry** as a fallback option
- **Real-time validation** against BTCPayServer
- **Check-in status** tracking to prevent duplicate entries
- **Offline-capable** with mock data mode

## Getting Started

### Prerequisites
- Node.js 18+ or Bun runtime
- BTCPayServer instance with API access
- Store ID and API key from BTCPayServer

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bps-companion.git
cd bps-companion

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
```

### Configuration

Edit `.env` with your BTCPayServer details:

```env
# BTCPayServer Configuration
BTCPAYSERVER_API_KEY=your-btcpay-api-key-here
NEXT_PUBLIC_BTCPAY_URL=https://your-btcpay-instance.com
NEXT_PUBLIC_STORE_ID=your-store-id
NEXT_PUBLIC_EVENT_ID=your-event-id

# Development Settings
NEXT_PUBLIC_USE_MOCK=false  # Set to true for demo mode
```

### Running the App

```bash
# Development mode
bun dev

# Production build
bun run build
bun start

# Run tests
npm test  # Note: Use npm for Jest tests
```

## Dashboard Overview

### Key Metrics
- **MRR**: Current month's revenue with growth percentage
- **Total Invoices**: Count of all invoices with settled breakdown
- **Average Transaction**: Mean value per settled invoice
- **Conversion Rate**: Percentage of settled vs total invoices

### Analytics Views
1. **Revenue Trend**: Bar chart showing monthly revenue
2. **Projections**: Line chart with 3-month revenue forecast
3. **Breakdown**: Invoice status and payment method distributions
4. **Products**: Top 5 best-selling items

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router
- **Styling**: TailwindCSS v4 + shadcn/ui
- **Charts**: Recharts for data visualization
- **Data Fetching**: React Query with server actions
- **Type Safety**: TypeScript throughout

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── actions/           # Server actions for API calls
│   ├── dashboard/         # Dashboard pages
│   └── check-in/          # Check-in pages
├── components/            # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   ├── check-in/          # Check-in components
│   └── ui/                # shadcn/ui components
├── services/              # API client services
│   ├── btcpay-client.ts   # Real BTCPay API integration
│   └── btcpay-mock.ts     # Mock data for development
└── types/                 # TypeScript definitions
```

## API Integration

The app integrates with BTCPayServer's Greenfield API v1:
- **Invoices**: Fetch, filter, and analyze invoice data
- **Store Info**: Get store configuration and settings
- **Payment Methods**: Retrieve enabled payment options
- **SatoshiTickets**: Check-in integration (with invoice fallback)

## Mock Mode

When `BTCPAYSERVER_API_KEY` is not set or `NEXT_PUBLIC_USE_MOCK=true`, the app runs in mock mode:
- Generates realistic sample data
- Simulates network delays
- Perfect for demos and development
- Shows "Using mock data" indicator

## Security

- API keys are handled server-side only
- Server actions prevent client exposure
- Environment variables follow Next.js conventions
- No sensitive data in client bundles

## Troubleshooting

### 401 Unauthorized Errors
If your BTCPayServer is behind an authentication proxy:
1. Verify API key permissions
2. Check if additional headers are required
3. Contact your BTCPay administrator

### Tests Failing
Use `npm test` instead of `bun test` - Bun's test runner doesn't support Jest mocks.

### Double QR Scanner
Disable React Strict Mode in development if you see duplicate scanners.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- BTCPayServer team for the excellent API
- SatoshiTickets plugin developers
- shadcn/ui for the component library