"use client";

import { ExternalLink, Plus, Settings, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StoresPage() {
  const [stores] = useState([
    {
      id: "1",
      name: "Main Store",
      url: "https://mainstore.btcpayserver.com",
      status: "active",
      currency: "BTC",
      invoices: 1234,
      revenue: "$45,231.89",
    },
    {
      id: "2",
      name: "Event Tickets Store",
      url: "https://events.btcpayserver.com",
      status: "active",
      currency: "BTC",
      invoices: 456,
      revenue: "$12,456.78",
    },
    {
      id: "3",
      name: "Test Store",
      url: "https://test.btcpayserver.com",
      status: "inactive",
      currency: "BTC",
      invoices: 12,
      revenue: "$123.45",
    },
  ]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground">
            Manage your BTCPay Server stores
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Store
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  <CardTitle className="text-lg">{store.name}</CardTitle>
                </div>
                <Badge
                  variant={store.status === "active" ? "default" : "secondary"}
                >
                  {store.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <span className="truncate">{store.url}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{store.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoices</span>
                  <span className="font-medium">{store.invoices}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">{store.revenue}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
