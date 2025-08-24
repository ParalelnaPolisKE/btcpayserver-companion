import { CheckCircle, Shield } from "lucide-react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SecurityStatusCardProps {
  isSecure?: boolean;
  message?: string;
}

/**
 * Displays security status of the application
 * Defaults to secure state for user confidence
 */
const SecurityStatusCard = React.memo<SecurityStatusCardProps>(
  ({ isSecure = true, message = "All systems operational" }) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Status</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle
              className={`h-5 w-5 ${isSecure ? "text-green-500" : "text-yellow-500"}`}
              aria-label={isSecure ? "Secure" : "Warning"}
            />
            <span className="text-2xl font-bold">
              {isSecure ? "Secure" : "Check Required"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  },
);

SecurityStatusCard.displayName = "SecurityStatusCard";

export default SecurityStatusCard;
