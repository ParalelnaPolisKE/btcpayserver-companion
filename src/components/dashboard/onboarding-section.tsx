"use client";

import { ArrowRight, CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getEncryptedDatabase } from "@/lib/encrypted-indexeddb";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

export function OnboardingSection() {
  const [isVisible, setIsVisible] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "connect-btcpay",
      title: "Connect to BTCPayServer",
      description: "Configure your BTCPayServer connection in Settings",
      completed: false,
      actionLabel: "Go to Settings",
      action: () => (window.location.href = "/settings"),
    },
    {
      id: "explore-apps",
      title: "Explore Available Apps",
      description: "Browse and install apps to extend functionality",
      completed: false,
      actionLabel: "Browse Apps",
      action: () => (window.location.href = "/apps"),
    },
    {
      id: "enable-app",
      title: "Enable Your First App",
      description: "Try the Financial Analysis or Event Check-in app",
      completed: false,
      actionLabel: "View Apps",
      action: () => (window.location.href = "/apps"),
    },
    {
      id: "secure-setup",
      title: "Review Security Settings",
      description: "Understand how we protect your data and plugins",
      completed: false,
      actionLabel: "Learn More",
      action: () =>
        document
          .getElementById("security-section")
          ?.scrollIntoView({ behavior: "smooth" }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOnboardingState = async () => {
    try {
      const db = getEncryptedDatabase();

      // Check if onboarding is dismissed
      const isDismissed = await db.getSetting("onboarding_dismissed");
      if (isDismissed) {
        setIsVisible(false);
      }

      // Check completed steps
      const completedSteps = (await db.getSetting("onboarding_steps")) || {};

      // Check actual state
      const hasApiKey = await db.getSetting("btcpay_api_key");
      const installedPlugins = await db.getInstalledPlugins();
      const enabledPlugins = installedPlugins.filter((p) => p.config.enabled);

      setSteps((prev) =>
        prev.map((step) => {
          let completed = completedSteps[step.id] || false;

          // Auto-complete based on actual state
          if (step.id === "connect-btcpay" && hasApiKey) {
            completed = true;
          }
          if (step.id === "explore-apps" && installedPlugins.length > 0) {
            completed = true;
          }
          if (step.id === "enable-app" && enabledPlugins.length > 0) {
            completed = true;
          }

          return { ...step, completed };
        }),
      );
    } catch (error) {
      console.error("Failed to load onboarding state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOnboardingState();
  }, [loadOnboardingState]);

  const dismissOnboarding = async () => {
    try {
      const db = getEncryptedDatabase();
      await db.setSetting("onboarding_dismissed", true);
      setIsVisible(false);
    } catch (error) {
      console.error("Failed to dismiss onboarding:", error);
    }
  };

  const markStepComplete = async (stepId: string) => {
    try {
      const db = getEncryptedDatabase();
      const completedSteps = (await db.getSetting("onboarding_steps")) || {};
      completedSteps[stepId] = true;
      await db.setSetting("onboarding_steps", completedSteps);

      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, completed: true } : step,
        ),
      );
    } catch (error) {
      console.error("Failed to mark step complete:", error);
    }
  };

  if (!isVisible || isLoading) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <button
        onClick={dismissOnboarding}
        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss onboarding"
      >
        <X className="h-4 w-4" />
      </button>

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Welcome to BTCPayServer Companion!</CardTitle>
        </div>
        <CardDescription>
          Complete these steps to get started with your companion app
        </CardDescription>

        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedCount} of {steps.length} completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.completed ? "bg-muted/50" : "hover:bg-muted/30"
            }`}
          >
            <div className="mt-0.5">
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="font-medium text-sm">{step.title}</div>
              <div className="text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>

            {!step.completed && step.action && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  step.action?.();
                  if (!step.completed) {
                    markStepComplete(step.id);
                  }
                }}
                className="h-7 px-2"
              >
                {step.actionLabel}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {completedCount === steps.length && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              🎉 Congratulations! You're all set up!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
