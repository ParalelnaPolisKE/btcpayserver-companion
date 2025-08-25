# BTCPayServer Companion

<div align="center">
  <img src="public/logo.svg" alt="BTCPayServer Companion Logo" width="128" height="128" />
  
  [![Version](https://img.shields.io/badge/version-0.3.1-blue.svg)](https://github.com/ParalelnaPolisKE/btcpayserver-companion/releases)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Build Status](https://github.com/ParalelnaPolisKE/btcpayserver-companion/workflows/Build%20and%20Release%20Tauri%20App/badge.svg)](https://github.com/ParalelnaPolisKE/btcpayserver-companion/actions)
  
  **A powerful web + cross-platform desktop companion app for BTCPayServer with plugins, analytics, and encrypted communication**
</div>

## 🚀 Features

### Core Functionality
- **🏪 Multi-Store Support** - Manage multiple BTCPayServer stores from a single dashboard
- **📊 Real-time Dashboard** - Monitor server status, Bitcoin price, and security metrics
- **🔌 Plugin System** - Extend functionality with secure, sandboxed plugins
- **💬 CryptoChat** - End-to-end encrypted chat for secure communication
- **🔐 Encrypted Storage** - Secure IndexedDB with encryption for sensitive data
- **📈 Bitcoin Price Tracking** - Real-time BTC price charts with historical data

### Built-in Plugins
- **Financial Analysis** - Comprehensive revenue analytics, MRR tracking, and projections
- **Events Check-in** - QR code-based event management system
- **Expense Tracking** - Track and categorize business expenses

### Security Features
- **Plugin Sandboxing** - Isolated execution environment for plugins
- **Code Scanning** - Automatic detection of malicious patterns
- **Permission System** - Granular control over plugin capabilities
- **Server-side API Keys** - Secure handling of sensitive credentials

## 📦 Installation

### Desktop Application (Recommended)

Download the latest release for your platform from the [Releases page](https://github.com/ParalelnaPolisKE/btcpayserver-companion/releases):

#### Windows
- **64-bit**: `BTCPayServer-Companion-0.3.1-win64-setup.exe`
- **32-bit**: `BTCPayServer-Companion-0.3.1-win32-setup.exe`

#### macOS
- Universal: `BTCPayServer-Companion-0.3.1-macos-universal.dmg`

#### Linux
- AppImage: `BTCPayServer-Companion-0.3.1-linux-x86_64.AppImage`
- Debian/Ubuntu: `btcpayserver-companion_0.3.1_linux_amd64.deb`
- RedHat/Fedora: `btcpayserver-companion-0.3.1-1.x86_64.rpm`

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ParalelnaPolisKE/btcpayserver-companion.git
cd btcpayserver-companion

# Install dependencies (requires Bun)
bun install

# Copy environment configuration
cp .env.example .env.local

# Run development server
bun dev

# Build for production
bun run build
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with your BTCPayServer configuration:

```env
# BTCPayServer API Configuration (Server-side only)
BTCPAYSERVER_API_KEY=your-api-key-here

# Client-side Configuration
NEXT_PUBLIC_BTCPAY_URL=https://your-btcpay-instance.com
NEXT_PUBLIC_STORE_ID=your-store-id
NEXT_PUBLIC_USE_MOCK=false  # Set to true for demo mode
```

### Getting Your API Key

1. Log in to your BTCPayServer instance
2. Navigate to **Account** → **API Keys**
3. Click **Generate Key**
4. Select permissions:
   - `btcpay.store.canviewinvoices` (required)
   - Additional permissions as needed
5. Copy the generated key to your `.env.local`

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Desktop**: Tauri 2.0 / Electron
- **Language**: TypeScript
- **Styling**: TailwindCSS v4 + shadcn/ui
- **State Management**: React Query + Context API
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library
- **Build Tools**: Bun, Rust (for Tauri)

### Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── actions/             # Server actions for API calls
│   ├── dashboard/           # Dashboard pages
│   ├── plugins/             # Plugin management
│   ├── settings/            # Settings pages
│   └── cryptochat/          # Encrypted chat feature
├── components/              # React components
│   ├── dashboard/           # Dashboard widgets
│   ├── layout/              # Layout components
│   └── ui/                  # shadcn/ui components
├── contexts/                # React contexts
│   ├── expenses-context.tsx
│   └── plugins-context.tsx
├── lib/                     # Utilities
│   ├── encrypted-indexeddb.ts
│   ├── env.ts
│   └── utils.ts
├── services/                # API services
│   ├── btcpay-client.ts    # BTCPay API client
│   ├── btcpay-mock.ts      # Mock data provider
│   ├── bitcoin-price.ts    # Price API integration
│   └── plugin-*.ts         # Plugin services
├── types/                   # TypeScript definitions
└── plugins/                 # Built-in plugins
    ├── financial-analysis/
    ├── events-checkin/
    └── template/
```

## 🔌 Plugin Development

### Creating a Plugin

1. Use the plugin template as a starting point:
   ```bash
   cp -r src/plugins/template src/plugins/my-plugin
   ```

2. Update the manifest.json:
   ```json
   {
     "id": "my-plugin",
     "name": "My Plugin",
     "version": "1.0.0",
     "description": "Plugin description",
     "permissions": ["storage", "btcpay"]
   }
   ```

3. Implement your plugin logic in `index.html`

4. Test in development mode

### Plugin API

Plugins have access to:
- **Storage API** - Persistent data storage
- **BTCPay API** - Access to invoice and store data
- **Message API** - Communication with the host app
- **UI Components** - Reusable UI elements

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- src/services/__tests__/

# Watch mode
npm test -- --watch
```

**Note**: Use `npm test` instead of `bun test` as Bun's test runner doesn't support Jest mocks properly.

## 📊 Performance

The app includes comprehensive performance optimizations:
- React component memoization
- Lazy loading for heavy components
- Code splitting with dynamic imports
- Optimized bundle size with tree-shaking
- Context optimization with useMemo
- 63% test coverage

## 🔒 Security Considerations

- **API Keys**: Stored server-side only, never exposed to client
- **Plugin Isolation**: Sandboxed iframe execution
- **Code Scanning**: Automatic malicious pattern detection
- **CSP**: Content Security Policy enforcement
- **Encryption**: AES-GCM for sensitive data storage
- **HTTPS Only**: Enforced for all external connections

## 🐛 Troubleshooting

### Common Issues

#### "Using mock data" appears despite API key
- Ensure API key is in `.env.local` (not `.env`)
- Restart the development server
- Check server logs for API connection errors

#### 401 Unauthorized from proxy
- Verify API key has correct permissions
- Check if BTCPayServer is behind an auth proxy
- Contact your BTCPay administrator for direct API access

#### Build errors on Windows
- Install Visual Studio Build Tools
- Ensure Rust toolchain is installed
- Run as Administrator if permission errors occur

#### Tests failing
- Use `npm test` instead of `bun test`
- Clear Jest cache: `npm test -- --clearCache`
- Check Node version (requires 18.17+)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed version history.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [BTCPayServer](https://btcpayserver.org/) team for the excellent API
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tauri](https://tauri.app/) for the desktop framework
- [Next.js](https://nextjs.org/) team for the web framework
- [Paralelná Polis Košice](https://www.paralelnapoliske.sk/) for supporting development

## 📞 Support

- **Documentation**: [Read the Docs](https://github.com/ParalelnaPolisKE/btcpayserver-companion/wiki)
- **Issues**: [GitHub Issues](https://github.com/ParalelnaPolisKE/btcpayserver-companion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ParalelnaPolisKE/btcpayserver-companion/discussions)
- **Security**: Report vulnerabilities to security@paralelnapoliske.sk

## 🚦 Status

- **Current Version**: 0.3.1
- **Status**: Active Development
- **Next Release**: 0.4.0 (Plugin Marketplace)

---

<div align="center">
  Made with ❤️ by the Paralelná Polis Košice community
  
  [Website](https://www.paralelnapoliske.sk) • [Twitter](https://twitter.com/paralelnapoliske) • [GitHub](https://github.com/ParalelnaPolisKE)
</div>