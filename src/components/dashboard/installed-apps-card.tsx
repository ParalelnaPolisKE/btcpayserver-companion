import { Package } from "lucide-react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InstalledAppsCardProps {
  totalPlugins: number;
  enabledPlugins: number;
}

/**
 * Displays installed and enabled plugin counts
 * Pure component with no side effects for optimal performance
 */
const InstalledAppsCard = React.memo<InstalledAppsCardProps>(
  ({ totalPlugins, enabledPlugins }) => {
    // Calculate disabled plugins for potential future use
    const disabledPlugins = totalPlugins - enabledPlugins;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Installed Apps</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPlugins}</div>
          <p className="text-xs text-muted-foreground">
            {enabledPlugins} enabled
            {disabledPlugins > 0 && `, ${disabledPlugins} disabled`}
          </p>
        </CardContent>
      </Card>
    );
  },
  // Only re-render if counts actually change
  (prevProps, nextProps) =>
    prevProps.totalPlugins === nextProps.totalPlugins &&
    prevProps.enabledPlugins === nextProps.enabledPlugins,
);

InstalledAppsCard.displayName = "InstalledAppsCard";

export default InstalledAppsCard;
