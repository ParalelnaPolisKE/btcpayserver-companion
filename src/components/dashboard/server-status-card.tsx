import { Server } from "lucide-react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServerStatusCardProps {
  status: "connected" | "disconnected" | "checking";
}

/**
 * Displays the current BTCPayServer connection status
 * Memoized to prevent unnecessary re-renders when parent updates
 */
const ServerStatusCard = React.memo<ServerStatusCardProps>(
  ({ status }) => {
    // Determine status indicator color based on connection state
    const getStatusColor = (currentStatus: typeof status): string => {
      const statusColors = {
        connected: "bg-green-500",
        disconnected: "bg-red-500",
        checking: "bg-yellow-500",
      } as const;

      return statusColors[currentStatus];
    };

    // Get human-readable status message
    const getStatusMessage = (currentStatus: typeof status): string => {
      const statusMessages = {
        connected: "BTCPayServer connected",
        disconnected: "Configure in settings",
        checking: "Checking connection...",
      } as const;

      return statusMessages[currentStatus];
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Server Status</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${getStatusColor(status)}`}
              aria-label={`Status: ${status}`}
            />
            <span className="text-2xl font-bold capitalize">{status}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getStatusMessage(status)}
          </p>
        </CardContent>
      </Card>
    );
  },
  // Custom comparison function for memo
  (prevProps, nextProps) => prevProps.status === nextProps.status,
);

ServerStatusCard.displayName = "ServerStatusCard";

export default ServerStatusCard;
