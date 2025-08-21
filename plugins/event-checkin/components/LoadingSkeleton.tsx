import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventCheckInLoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 animate-in fade-in-0 duration-500">
      {/* Header Skeleton */}
      <div className="text-center space-y-2">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[
          { label: "Total Attendees", icon: "👥" },
          { label: "Checked In", icon: "✅" },
          { label: "Pending", icon: "⏳" },
        ].map((stat, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <div className="text-2xl opacity-20">{stat.icon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-full max-w-[100px]" />
                <Skeleton className="h-3 w-8" />
              </div>
            </CardContent>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Card>
        ))}
      </div>

      {/* QR Scanner Section Skeleton */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {/* QR Scanner placeholder */}
            <div className="relative">
              <Skeleton className="h-64 w-64 rounded-lg" />
              {/* Corner brackets */}
              <div className="absolute top-2 left-2">
                <Skeleton className="h-8 w-2" />
                <Skeleton className="h-2 w-8 mt-[-2px]" />
              </div>
              <div className="absolute top-2 right-2">
                <Skeleton className="h-8 w-2 ml-6" />
                <Skeleton className="h-2 w-8 mt-[-2px] ml-auto" />
              </div>
              <div className="absolute bottom-2 left-2">
                <Skeleton className="h-2 w-8 mb-[-2px]" />
                <Skeleton className="h-8 w-2" />
              </div>
              <div className="absolute bottom-2 right-2">
                <Skeleton className="h-2 w-8 mb-[-2px] ml-auto" />
                <Skeleton className="h-8 w-2 ml-6" />
              </div>
              {/* Scanning line animation */}
              <div className="absolute inset-x-4 top-0 h-0.5 bg-primary/50 animate-scan" />
            </div>

            {/* Manual input section */}
            <div className="w-full max-w-md space-y-2">
              <Skeleton className="h-4 w-32 mx-auto" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Check-ins Table Skeleton */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 pb-3 border-b">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Table rows */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-4 py-3 items-center border-b last:border-0"
              >
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline Skeleton */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  {i < 4 && <Skeleton className="h-12 w-0.5 mt-2" />}
                </div>
                <div className="flex-1 pb-4">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
