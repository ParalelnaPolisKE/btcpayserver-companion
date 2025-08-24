import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Key,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SecurityFeature {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: ShieldCheck,
    title: "Plugin Sandboxing",
    description:
      "All plugins run in isolated environments preventing access to sensitive data",
  },
  {
    icon: Key,
    title: "Permission System",
    description: "Granular permissions control what each plugin can access",
  },
  {
    icon: Lock,
    title: "Code Scanning",
    description:
      "Automatic scanning for malicious code patterns before installation",
  },
  {
    icon: AlertTriangle,
    title: "Runtime Monitoring",
    description:
      "Real-time detection and blocking of suspicious plugin behavior",
  },
];

const bestPractices: string[] = [
  "Only install plugins from trusted sources",
  "Review plugin permissions before installation",
  "Keep your BTCPayServer Companion updated to the latest version",
  "Regularly review installed plugins and remove unused ones",
];

/**
 * Renders security information and best practices
 * Static content memoized for performance
 */
const SecurityTab = React.memo(() => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Security & Protection</CardTitle>
        </div>
        <CardDescription>
          How we keep your BTCPayServer and plugins secure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Priority Notice */}
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-900 dark:text-green-100">
              Your Security is Our Priority
            </p>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            BTCPayServer Companion implements multiple layers of security to
            protect your cryptocurrency operations and server from malicious
            plugins.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={`security-feature-${index}`}
                className="flex gap-3 p-4 rounded-lg border"
              >
                <div className="flex-shrink-0">
                  <div
                    className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"
                    aria-label={feature.title}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Practices */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-medium">Security Best Practices</h4>
          <div className="space-y-2">
            {bestPractices.map((practice, index) => (
              <div key={`practice-${index}`} className="flex items-start gap-2">
                <CheckCircle
                  className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">{practice}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <a
              href="https://docs.btcpayserver.org/Security/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Security Documentation
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/apps">
              View Plugin Permissions
              <ChevronRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

SecurityTab.displayName = "SecurityTab";

export default SecurityTab;
