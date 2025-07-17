# Static Export Migration

This app has been migrated from Next.js Server Actions to client-side API calls to support static export for Tauri.

## Key Changes

1. **Removed Server Actions**: All server actions in `src/app/actions/` have been removed.

2. **Client-Side API Service**: Created `src/services/dashboard-api.ts` that handles all BTCPay API calls on the client side.

3. **API Key Management**: 
   - API keys are stored in localStorage
   - Added a Settings page (`/settings`) where users can securely input their BTCPay API key
   - The key is never sent to any external server

4. **Static Export**: The app is now configured for static export with:
   ```js
   output: 'export'
   ```

## Running the App

### Web Development
```bash
bun run dev
```

### Tauri Development
```bash
bun run tauri:dev
```

### Building for Tauri
```bash
# Build Next.js first
bun run build

# Then build Tauri app
bun run tauri:build

# For universal macOS build
bun run tauri:build:universal
```

## Security Considerations

- API keys are stored in localStorage (consider using Tauri's secure storage in production)
- All API calls are made directly from the client to BTCPay Server
- No sensitive data is sent to any intermediate servers

## Features

- Full dashboard with financial metrics
- Multi-store support
- Event check-in functionality
- Revenue projections
- Expense tracking
- BTC price caching (5-minute cache)