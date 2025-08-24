# Changelog

All notable changes to BTCPayServer Companion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-08-24

### Added
- Comprehensive unit test suite with 63% code coverage
- Performance optimizations including React.memo for dashboard components
- Lazy loading for heavy components
- Context optimization with useMemo
- Environment configuration with proper server/client separation

### Changed
- Refactored dashboard into smaller, optimized components
- Improved bundle size with tree-shaking optimizations

### Fixed
- Component heading structure for better accessibility
- Environment variable handling with lazy evaluation
- Test timing issues with fake timers

## [0.3.0] - 2025-08-24

### Added
- **CryptoChat**: End-to-end encrypted chat functionality integrated into app bundles
- **Encrypted Database**: Secure IndexedDB storage with encryption for sensitive data
- Native application build improvements for cross-platform distribution

### Fixed
- Application titles and naming consistency
- Build process for native applications

### Changed
- Updated presentation materials

## [0.2.0] - 2025-08-22

### Added
- **Plugin System**: Comprehensive plugin architecture for extending functionality
  - Plugin template for developers
  - Events checkin plugin as default app
  - Improved plugin paths and settings
  - Security checkups for plugins
- **Bitcoin Price Chart**: Real-time BTC price tracking with visual charts
- **Comprehensive Guides Section**: Documentation and tutorials for users
- **Dynamic Stores Support**: Ability to manage multiple BTCPay stores
- **Standalone Apps**: Support for running as standalone applications

### Changed
- Moved version number next to Dashboard title for better visibility
- Improved financial analysis settings
- Enhanced cross-platform build support
- Proper application naming across platforms

### Removed
- Login UI from sidebar (simplified authentication flow)

## [0.1.0] - 2025-07-17

### Added
- **Initial Release** of BTCPayServer Companion
- **Financial Dashboard**: Simple dashboard for tracking BTCPay transactions
- **Revenue Display**: Enhanced revenue visualization with charts
- **Currency Support**: EUR/BTC toggle for financial displays
- **Profit/Loss Analysis**: Basic financial analytics
- **Multi-Store Support**: Manage multiple BTCPayServer stores
- **Membership Filtering**: Filter transactions by membership status
- **Events Checkin**: Initial implementation (plugin prototype)
- **Cross-Platform Builds**: 
  - macOS bundling support
  - Linux build with GitHub Actions
  - Docker containerization
- **GitHub Actions CI/CD**: Automated build and deployment pipeline

### Technical Stack
- Built with Next.js 15 and React 19
- TypeScript for type safety
- TailwindCSS for styling
- shadcn/ui component library
- Electron for desktop application
- Tauri for native application wrapper

## [0.0.1] - 2025-07-17

### Added
- Initial project setup from Create Next App
- Basic project structure and configuration

---

## Release Notes

### Version 0.3.x Series
The 0.3.x series focuses on security and communication features, introducing encrypted chat capabilities and secure data storage. This release also includes significant performance improvements and comprehensive test coverage.

### Version 0.2.x Series
The 0.2.x series established the plugin architecture, enabling extensibility through third-party plugins while maintaining security through comprehensive validation and sandboxing.

### Version 0.1.x Series
The 0.1.x series laid the foundation for BTCPayServer Companion, providing core financial tracking and multi-platform support.

## Compatibility

- **BTCPayServer**: Compatible with BTCPayServer 1.11.0 and later
- **Node.js**: Requires Node.js 18.17 or later
- **Platforms**: macOS, Linux, Windows (via Electron/Tauri)

## Links

- [GitHub Repository](https://github.com/ParalelnaPolisKE/btcpayserver-companion)
- [BTCPayServer Documentation](https://docs.btcpayserver.org/)
- [Report Issues](https://github.com/ParalelnaPolisKE/btcpayserver-companion/issues)

---

[0.3.0]: https://github.com/ParalelnaPolisKE/btcpayserver-companion/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ParalelnaPolisKE/btcpayserver-companion/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ParalelnaPolisKE/btcpayserver-companion/releases/tag/v0.1.0