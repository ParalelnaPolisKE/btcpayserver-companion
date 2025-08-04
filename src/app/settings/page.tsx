import { Suspense } from 'react';
import SettingsClient from './settings-client';

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    }>
      <SettingsClient />
    </Suspense>
  );
}