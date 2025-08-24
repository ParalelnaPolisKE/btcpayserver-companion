import {
  BookOpen,
  Code,
  CreditCard,
  ExternalLink,
  Package,
  Shield,
  Users,
} from "lucide-react";
import React, { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Tutorial {
  icon: typeof CreditCard;
  title: string;
  description: string;
  link: string;
  internal: boolean;
  duration: string;
}

const tutorials: Tutorial[] = [
  {
    icon: CreditCard,
    title: "Getting Started with BTCPayServer Companion",
    description: "Learn the basics of setting up and using the companion app",
    link: "/guides#getting-started",
    internal: true,
    duration: "5 min",
  },
  {
    icon: Package,
    title: "Installing and Managing Apps",
    description: "Discover how to extend functionality with apps",
    link: "/guides#managing-apps",
    internal: true,
    duration: "3 min",
  },
  {
    icon: Shield,
    title: "Understanding Plugin Security",
    description: "Learn how we protect your server from malicious plugins",
    link: "/guides#plugin-security",
    internal: true,
    duration: "10 min",
  },
  {
    icon: Code,
    title: "Developing Your Own Plugin",
    description: "Create custom plugins for your specific needs",
    link: "/guides#developing-plugins",
    internal: true,
    duration: "15 min",
  },
];

/**
 * Renders tutorial cards with navigation handling
 * Memoized to prevent re-renders when parent updates
 */
const TutorialsTab = React.memo(() => {
  // Secure navigation handler with validation
  const handleTutorialClick = useCallback((tutorial: Tutorial) => {
    // Validate link format to prevent XSS
    if (!tutorial.link || typeof tutorial.link !== "string") {
      console.error("Invalid tutorial link");
      return;
    }

    if (tutorial.internal) {
      if (tutorial.link.startsWith("#")) {
        // Smooth scroll to anchor
        const element = document.querySelector(tutorial.link);
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        // Internal navigation
        window.location.href = tutorial.link;
      }
    } else {
      // External link - open in new tab with security attributes
      window.open(tutorial.link, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>
          Learn how to use BTCPayServer Companion effectively
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {tutorials.map((tutorial, index) => {
            const Icon = tutorial.icon;
            return (
              <div
                key={`tutorial-${index}`}
                className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleTutorialClick(tutorial)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTutorialClick(tutorial);
                  }
                }}
                aria-label={`Tutorial: ${tutorial.title}`}
              >
                <div className="mt-0.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{tutorial.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {tutorial.duration}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tutorial.description}
                  </p>
                </div>
                {!tutorial.internal && (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Need More Help?</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Visit our comprehensive documentation for detailed guides and API
            references.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a
                href="https://docs.btcpayserver.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href="https://chat.btcpayserver.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Community Chat
                <Users className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TutorialsTab.displayName = "TutorialsTab";

export default TutorialsTab;
