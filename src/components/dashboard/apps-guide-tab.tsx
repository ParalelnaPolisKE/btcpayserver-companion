import { CheckCircle, ChevronRight, Lock, Zap } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InstallationStep {
  number: number;
  title: string;
  description: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

const installationSteps: InstallationStep[] = [
  {
    number: 1,
    title: "Browse Available Apps",
    description:
      "Visit the Apps page to see all available plugins. Built-in apps like Financial Analysis and Event Check-in are pre-installed and ready to use.",
    action: (
      <Button size="sm" variant="outline" asChild>
        <Link href="/apps">
          Go to Apps
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    ),
  },
  {
    number: 2,
    title: "Enable Apps",
    description:
      "Toggle the switch on any app card to enable it. Enabled apps will appear in the sidebar for quick access.",
  },
  {
    number: 3,
    title: "Upload Custom Apps",
    description:
      "Advanced users can upload custom plugins as ZIP files. All uploaded plugins go through our security scanning process before installation.",
    badge: (
      <Badge variant="outline" className="text-xs">
        <Lock className="mr-1 h-3 w-3" />
        Security Verified
      </Badge>
    ),
  },
];

interface PopularApp {
  name: string;
  description: string;
  icon: typeof Zap;
  iconColor: string;
  badge: string;
}

const popularApps: PopularApp[] = [
  {
    name: "Financial Analysis",
    description: "Revenue analytics and reporting",
    icon: Zap,
    iconColor: "text-yellow-500",
    badge: "Built-in",
  },
  {
    name: "Event Check-in",
    description: "QR code-based event management",
    icon: CheckCircle,
    iconColor: "text-green-500",
    badge: "Built-in",
  },
];

/**
 * Renders app installation and management guide
 * Pure component with no external dependencies for optimal performance
 */
const AppsGuideTab = React.memo(() => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>App Installation & Management</CardTitle>
        <CardDescription>
          Extend BTCPayServer Companion with powerful apps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {installationSteps.map((step) => (
            <div
              key={`step-${step.number}`}
              className="flex gap-4 p-4 rounded-lg bg-muted/50"
            >
              <div className="flex-shrink-0">
                <div
                  className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                  aria-label={`Step ${step.number}`}
                >
                  <span className="text-sm font-bold text-primary">
                    {step.number}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                {step.action}
                {step.badge}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Popular Apps</h4>
          <div className="grid gap-3">
            {popularApps.map((app, index) => {
              const Icon = app.icon;
              return (
                <div
                  key={`app-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${app.iconColor}`} />
                    <div>
                      <p className="font-medium text-sm">{app.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.description}
                      </p>
                    </div>
                  </div>
                  <Badge>{app.badge}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AppsGuideTab.displayName = "AppsGuideTab";

export default AppsGuideTab;
