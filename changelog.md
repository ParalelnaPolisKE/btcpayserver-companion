# Changelog

All notable changes to BTCPayServer Companion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-08-21

### Added
- Comprehensive Guides section with tutorials for:
  - Getting Started with BTCPayServer Companion
  - Installing and Managing Apps
  - Understanding Plugin Security
  - Developing Your Own Plugins
- Guides navigation integrated into main app sidebar as nested submenu
- Modern, clean reading experience with improved typography

### Changed
- Redesigned guides layout with full-width content area
- Enhanced visual hierarchy and spacing throughout the application
- Improved code block styling with syntax highlighting
- Refined alert and notification components

## [0.2.0] - 2025

### Added
- Plugin template for developers to create custom plugins
- Dynamic store management with automatic BTCPay store detection
- Cross-platform build support (Windows, macOS, Linux)
- Standalone apps architecture allowing plugins to run independently
- Enhanced security checkups and monitoring for plugins
- Improved plugin path resolution and file handling

### Changed
- Updated application name to "BTCPayServer Companion" across all platforms
- Refactored Financial Analysis plugin settings for better UX
- Enhanced plugin manifest validation and security scanning

### Fixed
- Plugin loading issues with relative paths
- Store switching functionality in multi-store setups

## [0.1.0] - 2025-01-17

### Added
- Initial release of BTCPayServer Companion as Tauri desktop application
- Core plugin system architecture with sandboxed execution
- Financial Analysis plugin with:
  - Monthly Recurring Revenue (MRR) tracking with growth rates
  - Revenue trends visualization over 6 months
  - Revenue projections using linear regression
  - Invoice status breakdown charts
  - Payment method analytics
  - Top products report
  - Average transaction value calculations
  - Conversion rate metrics
  - Export functionality for data
- Event Check-in plugin for QR code-based event management
- Multi-store support with store filtering
- Mock mode that automatically activates when no API key is configured
- Offline mode with IndexedDB storage for data persistence
- Linux build support with GitHub Actions and Docker
- macOS and Linux bundling capabilities

### Features
- BTCPayServer Greenfield API integration
- Secure plugin sandboxing with iframe isolation
- Real-time invoice tracking and analytics
- Membership filtering for store data
- Server actions architecture for secure API key handling
- React Query integration for efficient data fetching and caching
- Comprehensive unit tests with Jest and React Testing Library
- Dark mode support via Next.js theme
- Responsive UI built with shadcn/ui components
- Environment variable configuration for BTCPayServer connection
- CLAUDE.md documentation for development guidance

### Technical Details
- Built with Next.js 15 and App Router
- Tauri for desktop application wrapper
- TypeScript for type safety
- TailwindCSS for styling
- Recharts for data visualization
- Zod for runtime validation
- Axios for HTTP requests
- Server-side environment variable handling for security

### Security
- Plugin permission system
- Automatic code scanning for malicious patterns
- Runtime monitoring of plugin behavior
- Content Security Policy enforcement

### Known Issues
- Bun test runner doesn't support Jest mocks - use `npm test` instead
- BTCPayServer behind authentication proxy may require additional configuration

---

[0.3.0]: https://github.com/ParalelnaPolisKE/btcpayserver-companion/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ParalelnaPolisKE/btcpayserver-companion/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ParalelnaPolisKE/btcpayserver-companion/releases/tag/v0.1.0