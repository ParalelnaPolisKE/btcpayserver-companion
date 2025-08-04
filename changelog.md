# Changelog

All notable changes to the BTCPayServer Companion App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-17

### Added
- Initial release of BTCPayServer Companion App
- Financial dashboard with comprehensive analytics:
  - Monthly Recurring Revenue (MRR) tracking with growth rates
  - Revenue trends visualization over 6 months
  - Revenue projections using linear regression
  - Invoice status breakdown charts
  - Payment method analytics
  - Top products report
  - Average transaction value calculations
  - Conversion rate metrics
- Mock mode that automatically activates when no API key is configured
- Server actions architecture for secure API key handling
- React Query integration for efficient data fetching and caching
- Comprehensive unit tests with Jest and React Testing Library
- Dark mode support via Next.js theme
- Responsive UI built with shadcn/ui components
- Environment variable configuration for BTCPayServer connection
- CLAUDE.md documentation for development guidance

### Fixed
- Mock mode incorrectly showing despite API key being set
- Server-side environment variable handling for security

### Technical Details
- Built with Next.js 15 and App Router
- TypeScript for type safety
- TailwindCSS for styling
- Recharts for data visualization
- Zod for runtime validation
- Axios for HTTP requests
- Server-side environment variable handling for security

### Known Issues
- Bun test runner doesn't support Jest mocks - use `npm test` instead
- BTCPayServer behind authentication proxy may require additional configuration

### Future Enhancements
- Multi-store aggregated analytics
- Export functionality for financial data
- Real-time payment notifications
- Enhanced filtering and date range selection
- Custom report builder
- WebSocket real-time updates
- PWA capabilities for mobile devices