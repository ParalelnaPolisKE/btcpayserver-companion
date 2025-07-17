import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Settings, Calendar, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">
          BTCPay Companion
        </h1>
        <p className="text-center text-muted-foreground mb-12">
          Event Management and Check-in Service for BTCPayServer
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <CardTitle>Event Check-in</CardTitle>
              </div>
              <CardDescription>
                Scan QR codes or manually enter ticket numbers to check attendees into events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/check-in">
                <Button className="w-full">
                  Open Check-in Service
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <CardTitle>Event Management</CardTitle>
              </div>
              <CardDescription>
                Create and manage events, configure ticket tiers, and view sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>Attendee Reports</CardTitle>
              </div>
              <CardDescription>
                View check-in statistics, export attendee lists, and generate reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle>Settings</CardTitle>
              </div>
              <CardDescription>
                Configure BTCPayServer connection, manage API keys, and set preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            This companion app works with the BTCPayServer SatoshiTickets plugin
            to provide a streamlined check-in experience for event staff.
          </p>
        </div>
      </div>
    </div>
  );
}