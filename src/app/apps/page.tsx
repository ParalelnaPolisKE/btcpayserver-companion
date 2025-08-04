'use client';

import { Suspense } from 'react';
import AppsClient from './apps-client';

export default function AppsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Apps</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading apps...</p>
        </div>
      </div>
    }>
      <AppsClient />
    </Suspense>
  );
}