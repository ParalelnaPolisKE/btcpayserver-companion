# Changelog

All notable changes to the BTCPayServer Companion App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-17

### Added
- Initial release of BTCPayServer Companion App for event check-ins
- QR code scanner functionality using html5-qrcode library
- Manual ticket number entry as fallback option
- Dual API approach: SatoshiTickets plugin endpoints with invoice API fallback
- Mock mode that automatically activates when no API key is configured
- Server actions architecture for secure API key handling
- React Query integration for efficient data fetching and caching
- Comprehensive unit tests with Jest and React Testing Library
- Dark mode support via Next.js theme
- Responsive UI built with shadcn/ui components
- Environment variable configuration for BTCPayServer connection
- CLAUDE.md documentation for development guidance

### Fixed
- Double QR scanner rendering issue in React strict mode
- Mock mode incorrectly showing despite API key being set
- Ticket lookup failures by implementing invoice API fallback

### Technical Details
- Built with Next.js 15 and App Router
- TypeScript for type safety
- TailwindCSS for styling
- Zod for runtime validation
- Axios for HTTP requests
- Server-side environment variable handling for security

### Known Issues
- Bun test runner doesn't support Jest mocks - use `npm test` instead
- SatoshiTickets plugin endpoints may not be exposed in all BTCPayServer configurations
- Invoice metadata update endpoint may require additional permissions

### Future Enhancements
- Offline mode with sync capabilities
- Batch check-in functionality
- Event statistics dashboard
- Export check-in data
- Multi-language support
- WebSocket real-time updates
- PWA capabilities for mobile devices