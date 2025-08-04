# BTCPayServer Companion Plugin Development Guide

## Overview

BTCPayServer Companion supports a modular plugin architecture that allows developers to create and distribute extensions as standalone React applications. Plugins can be distributed through our marketplace or as ZIP files that users can upload directly.

## Plugin Structure

Each plugin must follow this directory structure:

```
my-plugin/
├── manifest.json       # Plugin metadata and configuration
├── package.json        # NPM package configuration
├── index.tsx          # Main entry point
├── components/        # React components
│   └── ...
├── assets/           # Static assets (images, icons, etc.)
│   └── ...
└── README.md         # Plugin documentation
```

## Manifest File

The `manifest.json` file defines your plugin's metadata and requirements:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A brief description of your plugin",
  "author": "Your Name",
  "homepage": "https://example.com",
  "license": "MIT",
  "main": "index.tsx",
  "icon": "icon-name",
  "routes": {
    "main": "/",
    "settings": "/settings"
  },
  "requiredPermissions": [
    {
      "permission": "btcpay.store.canviewinvoices",
      "description": "View invoices",
      "required": true
    }
  ],
  "dependencies": {
    "some-package": "^1.0.0"
  },
  "isPaid": false,
  "price": null,
  "category": "analytics",
  "tags": ["tag1", "tag2"],
  "minAppVersion": "1.0.0"
}
```

## Entry Point (index.tsx)

Your plugin's main file should export a default React component:

```tsx
import React from 'react';

export const metadata = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
};

export default function MyPlugin({ route }: { route: string }) {
  // Handle different routes within your plugin
  switch (route) {
    case '/settings':
      return <SettingsComponent />;
    default:
      return <MainComponent />;
  }
}
```

## Using App Context

Plugins have access to the app's context providers:

```tsx
import { useStores } from '@/contexts/stores-context';
import { useExpenses } from '@/contexts/expenses-context';
import { usePlugins } from '@/contexts/plugins-context';

function MyComponent() {
  const { stores } = useStores();
  const { categories } = useExpenses();
  const { isPluginEnabled } = usePlugins();
  
  // Your component logic
}
```

## API Access

Plugins can access the BTCPay API through the configured API key:

```tsx
import { BTCPayClient } from '@/services/btcpay-client';

async function fetchData() {
  const apiKey = localStorage.getItem('btcpay_api_key');
  const client = new BTCPayClient({
    serverUrl: process.env.NEXT_PUBLIC_BTCPAY_URL,
    apiKey,
    storeId: 'store-id'
  });
  
  const invoices = await client.getInvoices();
  // Process data
}
```

## Permissions

Declare required BTCPay API permissions in your manifest. Users will see these when installing your plugin:

```json
"requiredPermissions": [
  {
    "permission": "btcpay.store.canviewinvoices",
    "description": "View and analyze invoice data",
    "required": true
  },
  {
    "permission": "btcpay.store.canmodifyinvoices",
    "description": "Update invoice metadata",
    "required": false
  }
]
```

## Building and Distribution

### Local Development

1. Create your plugin in the `plugins/` directory
2. Run the app in development mode
3. Your plugin will be automatically loaded

### Creating a Distribution Package

1. Build your plugin:
   ```bash
   cd plugins/my-plugin
   npm run build
   ```

2. Create a ZIP archive:
   ```bash
   zip -r my-plugin.zip manifest.json package.json index.tsx components/ assets/
   ```

3. Users can upload this ZIP file through the Apps interface

### Marketplace Distribution

To distribute through the marketplace:

1. Submit your plugin for review
2. Include screenshots and detailed documentation
3. Set pricing (if applicable)
4. Maintain version compatibility

## Best Practices

1. **Keep dependencies minimal** - Use peer dependencies when possible
2. **Follow React best practices** - Use hooks, avoid class components
3. **Handle errors gracefully** - Provide user-friendly error messages
4. **Respect permissions** - Only request necessary permissions
5. **Optimize performance** - Lazy load components when possible
6. **Document your plugin** - Include clear setup and usage instructions
7. **Version compatibility** - Test with different app versions
8. **Secure API usage** - Never expose API keys in client code

## Example: Financial Analysis Plugin

See the `plugins/financial-analysis/` directory for a complete example of a production-ready plugin that includes:

- Dashboard with charts and metrics
- Settings management
- Store configuration
- Expense tracking
- Permission handling

## Testing Your Plugin

1. Place your plugin in the `plugins/` directory
2. Run the development server
3. Navigate to `/apps` and install your plugin
4. Test all routes and functionality
5. Verify permission requirements
6. Test error handling

## Support

For help with plugin development:
- Check the example plugins
- Review the API documentation
- Join our developer community
- Submit issues on GitHub