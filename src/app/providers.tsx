"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ExpensesProvider } from "@/contexts/expenses-context";
import { PluginsProvider } from "@/contexts/plugins-context";

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
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ExpensesProvider>
          <PluginsProvider>
            {children}
            <Toaster position="top-center" />
          </PluginsProvider>
        </ExpensesProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
