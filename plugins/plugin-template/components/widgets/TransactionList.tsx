/**
 * Transaction List Widget
 * Displays a list of payment transactions with details
 */

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ExternalLink } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Payment, TimePeriod } from "../../types";
import {
  formatCurrency,
  formatRelativeTime,
  truncate,
} from "../../utils/formatters";
import { LoadingSkeleton } from "../LoadingSkeleton";

interface TransactionListProps {
  timePeriod?: TimePeriod;
  limit?: number;
  showPagination?: boolean;
  compact?: boolean;
}

export function TransactionList({
  timePeriod = "30d",
  limit = 10,
  showPagination = true,
  compact = false,
}: TransactionListProps) {
  const [page, setPage] = React.useState(1);

  // Fetch transactions
  const { data, isLoading, error } = useQuery({
    queryKey: ["transactions", timePeriod, page, limit],
    queryFn: async () => {
      // This would call your API service
      // For now, returning mock data
      return fetchTransactions(timePeriod, page, limit);
    },
  });

  if (isLoading) {
    return <LoadingSkeleton variant="list" count={5} />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load transactions
      </div>
    );
  }

  if (!data || data.transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    );
  }

  if (compact) {
    return <CompactTransactionList transactions={data.transactions} />;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-mono text-sm">
                {truncate(tx.id, 12)}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(Number.parseFloat(tx.amount), tx.currency)}
              </TableCell>
              <TableCell>
                <StatusBadge status={tx.status} />
              </TableCell>
              <TableCell>{tx.paymentMethod || "Unknown"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeTime(tx.createdTime)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showPagination && data.hasMore && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} - {page * limit} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for dashboards
 */
function CompactTransactionList({ transactions }: { transactions: Payment[] }) {
  return (
    <div className="space-y-2">
      {transactions.slice(0, 5).map((tx) => (
        <div key={tx.id} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <StatusIndicator status={tx.status} />
            <div>
              <p className="text-sm font-medium">
                {formatCurrency(Number.parseFloat(tx.amount), tx.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(tx.createdTime)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: Payment["status"] }) {
  const getVariant = () => {
    switch (status) {
      case "Settled":
        return "default";
      case "Processing":
        return "secondary";
      case "New":
        return "outline";
      case "Expired":
      case "Invalid":
        return "destructive";
      default:
        return "outline";
    }
  };

  return <Badge variant={getVariant()}>{status}</Badge>;
}

/**
 * Status indicator dot
 */
function StatusIndicator({ status }: { status: Payment["status"] }) {
  const getColor = () => {
    switch (status) {
      case "Settled":
        return "bg-green-500";
      case "Processing":
        return "bg-yellow-500";
      case "New":
        return "bg-blue-500";
      case "Expired":
        return "bg-gray-500";
      case "Invalid":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return <div className={`h-2 w-2 rounded-full ${getColor()}`} />;
}

// Mock data fetcher - replace with actual API call
async function fetchTransactions(
  _timePeriod: TimePeriod,
  page: number,
  limit: number,
): Promise<{ transactions: Payment[]; total: number; hasMore: boolean }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock transactions
  const transactions: Payment[] = Array.from({ length: limit }, (_, i) => ({
    id: `inv_${Math.random().toString(36).substr(2, 9)}`,
    storeId: "store_123",
    amount: (Math.random() * 1000).toFixed(2),
    currency: "USD",
    status: ["Settled", "Processing", "New", "Expired", "Invalid"][
      Math.floor(Math.random() * 5)
    ] as Payment["status"],
    createdTime:
      Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 30),
    paymentMethod: ["Bitcoin", "Lightning", "Credit Card"][
      Math.floor(Math.random() * 3)
    ],
    buyer: {
      email: `user${i}@example.com`,
      name: `User ${i}`,
    },
  }));

  return {
    transactions,
    total: 100,
    hasMore: page * limit < 100,
  };
}
