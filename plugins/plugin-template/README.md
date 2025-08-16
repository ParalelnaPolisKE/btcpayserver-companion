# Plugin Template - Payment Analytics

This is a template plugin for BTCPay Companion that demonstrates best practices and showcases Greenfield API capabilities.

## Features Demonstrated

- ✅ **API Integration**: Fetching invoices and payment data
- ✅ **State Management**: Using React hooks and context
- ✅ **Settings Persistence**: Storing user preferences in IndexedDB
- ✅ **Loading States**: Skeleton loaders for better UX
- ✅ **Error Handling**: Graceful error states and fallbacks
- ✅ **Responsive Design**: Mobile-friendly layouts
- ✅ **TypeScript**: Full type safety
- ✅ **Component Organization**: Clean separation of concerns
- ✅ **Documentation**: Inline comments and JSDoc

## Directory Structure

```
plugin-template/
├── README.md                 # This file
├── manifest.json            # Plugin metadata and configuration
├── index.tsx               # Main entry point
├── components/             # React components
│   ├── PaymentAnalytics.tsx    # Main component
│   ├── PaymentSettings.tsx     # Settings component
│   ├── LoadingSkeleton.tsx     # Loading states
│   ├── ErrorBoundary.tsx       # Error handling
│   └── widgets/                 # Reusable widgets
│       ├── MetricCard.tsx
│       ├── PaymentChart.tsx
│       └── TransactionList.tsx
├── hooks/                  # Custom React hooks
│   ├── usePaymentData.ts
│   └── usePluginSettings.ts
├── services/              # API and business logic
│   ├── api.ts            # Greenfield API client
│   └── analytics.ts      # Data processing
├── types/                # TypeScript definitions
│   └── index.ts
└── utils/                # Utility functions
    ├── formatters.ts
    └── constants.ts
```

## Getting Started

### 1. Copy this template

```bash
cp -r plugins/plugin-template plugins/my-plugin
```

### 2. Update manifest.json

Edit the manifest with your plugin's information:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Description of your plugin"
}
```

### 3. Implement your features

Follow the patterns in this template to add your functionality.

## Best Practices Demonstrated

### 1. **Separation of Concerns**
- Components handle UI
- Hooks manage state and side effects
- Services handle API calls and business logic
- Utils contain pure functions

### 2. **Error Handling**
- Error boundaries for component crashes
- Try-catch blocks for async operations
- User-friendly error messages
- Fallback UI components

### 3. **Performance**
- Memoization with useMemo and useCallback
- Lazy loading with dynamic imports
- Debounced API calls
- Efficient re-renders

### 4. **Accessibility**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### 5. **Testing Considerations**
- Testable component structure
- Pure functions in utils
- Dependency injection for services
- Mock data for development

## API Integration Examples

This template demonstrates:

1. **Fetching Invoices** - Get payment data with filters
2. **Store Information** - Access store configuration
3. **Payment Methods** - Analyze payment method usage
4. **Real-time Updates** - Poll for new payments
5. **Error Handling** - Graceful API failure recovery

## Component Patterns

### Container/Presenter Pattern
```typescript
// Container: Handles logic
const PaymentAnalyticsContainer = () => {
  const data = usePaymentData();
  return <PaymentAnalyticsView data={data} />;
};

// Presenter: Handles display
const PaymentAnalyticsView = ({ data }) => {
  return <div>{/* UI */}</div>;
};
```

### Compound Components
```typescript
<MetricCard>
  <MetricCard.Title>Revenue</MetricCard.Title>
  <MetricCard.Value>$1,234</MetricCard.Value>
  <MetricCard.Change>+12%</MetricCard.Change>
</MetricCard>
```

### Render Props
```typescript
<DataProvider
  render={(data) => <Chart data={data} />}
/>
```

## Development Tips

1. **Use TypeScript** - Catch errors early
2. **Keep components small** - Single responsibility
3. **Document your code** - Future you will thank you
4. **Handle edge cases** - Empty states, errors, loading
5. **Test manually** - Try different scenarios
6. **Optimize performance** - Profile and measure

## Contributing

When creating plugins:
1. Follow this template structure
2. Document your API usage
3. Handle errors gracefully
4. Make it accessible
5. Keep it maintainable

## License

MIT - Use this template freely for your plugins!