'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { StoresProvider } from '@/contexts/stores-context';
import { ExpensesProvider } from '@/contexts/expenses-context';
import { PluginsProvider } from '@/contexts/plugins-context';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StoresProvider>
        <ExpensesProvider>
          <PluginsProvider>
            {children}
            <Toaster position="top-center" />
          </PluginsProvider>
        </ExpensesProvider>
      </StoresProvider>
    </QueryClientProvider>
  );
}