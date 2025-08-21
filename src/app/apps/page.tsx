"use client";

import { Suspense } from "react";
import AppsClient from "./apps-client";

export default function AppsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <h1 className="text-3xl font-bold mb-8">Apps</h1>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading apps...</p>
          </div>
        </div>
      }
    >
      <div className="p-4 md:p-6">
        <AppsClient />
      </div>
    </Suspense>
  );
}
