import { Suspense } from 'react';
import SettingsClient from './settings-client';

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    }>
      <div className="p-4 md:p-6">
        <SettingsClient />
      </div>
    </Suspense>
  );
}