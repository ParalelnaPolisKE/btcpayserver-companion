# BTCPayServer Companion Development Guide

This document contains essential information for developing the BTCPayServer Companion app, including BTCPayServer API integration details and project architecture.

## BTCPayServer Greenfield API

### Overview
BTCPayServer provides a comprehensive REST API called Greenfield API for interacting with stores, invoices, and payments. The API specification is available in `greenfield-api-swagger.json`.

### Key API Endpoints

#### Authentication
- **API Keys**: Use Bearer token authentication with `Authorization: token YOUR_API_KEY`
- **Permissions**: Different endpoints require specific permissions (e.g., `btcpay.store.canviewinvoices`)

#### Core Endpoints Used
1. **Invoices** (`/api/v1/stores/{storeId}/invoices`)
   - GET: List invoices with filtering options
   - POST: Create new invoices
   - GET `/{invoiceId}`: Get specific invoice details
   - PUT `/{invoiceId}`: Update invoice metadata

2. **Apps** (`/api/v1/stores/{storeId}/apps`)
   - Support for Point of Sale and Crowdfund apps

3. **Payment Methods** (`/api/v1/stores/{storeId}/payment-methods`)
   - Track payment status and methods

## Project Architecture

### Technology Stack
- **Next.js 15**: App Router with React Server Components
- **TypeScript**: Full type safety
- **TailwindCSS + shadcn/ui**: Modern UI components
- **React Query**: Data fetching and caching
- **Jest + React Testing Library**: Comprehensive testing

### Directory Structure
```
src/
├── app/                        # Next.js App Router
│   ├── dashboard/             # Dashboard page
│   ├── settings/              # Settings page
│   └── providers.tsx         # React Query setup
├── components/               # Reusable components
│   └── layout/              # Layout components
├── services/                # API clients
│   ├── btcpay-client.ts    # Real BTCPay API client
│   └── btcpay-mock.ts      # Mock implementation
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities
│   └── env.ts              # Environment configuration
└── types/                   # TypeScript definitions
```

### Environment Variables

**Server-side (no prefix)**:
- `BTCPAYSERVER_API_KEY`: BTCPay API key (required for real API)

**Client-side (NEXT_PUBLIC_ prefix)**:
- `NEXT_PUBLIC_BTCPAY_URL`: BTCPayServer instance URL
- `NEXT_PUBLIC_STORE_ID`: Store ID for API calls
- `NEXT_PUBLIC_USE_MOCK`: Force mock mode (true/false)

### Key Design Decisions

1. **Server/Client Split**: 
   - Server components handle API keys securely
   - Client components handle UI interactions
   - Server actions bridge the gap

2. **Mock Mode**:
   - Automatically enabled when no API key is present
   - Includes sample data for testing
   - Simulates network delays

## Development Workflow

### Running the Project
```bash
# Install dependencies
bun install

# Run development server
bun dev

# Run tests with Jest (not bun test)
npm test
```

### Testing
- Use `npm test` instead of `bun test` (Jest mocks don't work with Bun)
- Mock client is used in tests automatically
- All components have comprehensive test coverage

### Adding New Features

1. **New API Endpoints**:
   - Add to `btcpay-client.ts`
   - Create mock implementation in `btcpay-mock.ts`
   - Add server action in `app/actions/`

2. **New UI Components**:
   - Create in `components/` with tests
   - Use shadcn/ui components: `bunx --bun shadcn@latest add <component>`
   - Follow existing patterns for consistency

3. **State Management**:
   - Use React Query for server state
   - Local state with useState/useReducer
   - Server actions for API calls

## Common Issues & Solutions

### Issue: "Using mock data" appears despite API key
**Solution**: API key must be accessed server-side. Use server actions, not client-side config.

### Issue: Tests fail with Bun
**Solution**: Use `npm test` - Bun's test runner doesn't support Jest mocks properly.

### Issue: 401 Unauthorized from Authentication Proxy
**Symptoms**: Error shows HTML response from authentik or similar proxy instead of BTCPay API response.

**Possible Causes**:
1. BTCPayServer is behind an authentication proxy that intercepts API requests
2. API key format or permissions are incorrect
3. Additional headers required by the proxy

**Solutions**:
1. **Verify API Key Permissions**:
   - Ensure the API key has `btcpay.store.canviewinvoices` permission
   - Check if the key is a Greenfield API key (not legacy)

2. **Check Debug Logs**:
   - Console shows request configuration and headers
   - Verify the Authorization header format: `token YOUR_API_KEY`

3. **Proxy Configuration**:
   - Contact your BTCPay administrator about API access through the proxy
   - Ask if there's a direct API endpoint bypassing the proxy
   - Check if additional headers like `X-API-Key` or cookies are required

4. **Test Direct Access**:
   ```bash
   curl -H "Authorization: token YOUR_API_KEY" \
        https://your-btcpay.com/api/v1/stores/YOUR_STORE_ID
   ```

## Future Enhancements

1. **Analytics Dashboard**: Enhanced revenue and transaction analytics
2. **Multi-store Support**: Manage multiple BTCPay stores
3. **Export Features**: Export data in various formats
4. **Notification System**: Real-time payment notifications
5. **Role-based Access**: Different permissions for staff

## Resources

- [BTCPayServer Docs](https://docs.btcpayserver.org/)
- [Greenfield API Reference](https://docs.btcpayserver.org/API/Greenfield/v1/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)