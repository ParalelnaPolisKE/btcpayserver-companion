import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoadingSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="h-8 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 bg-muted rounded animate-pulse flex-1" />
          <div className="h-10 bg-muted rounded animate-pulse w-20" />
        </div>
      </CardContent>
    </Card>
  );
}