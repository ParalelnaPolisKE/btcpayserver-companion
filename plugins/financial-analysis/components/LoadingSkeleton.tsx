import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FinancialAnalysisLoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in-0 duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Card>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart Skeleton */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Chart bars skeleton */}
              <div className="flex items-end gap-2 h-48">
                {[40, 60, 45, 70, 55, 80, 65, 75, 50, 85, 70, 60].map(
                  (height, i) => (
                    <Skeleton
                      key={i}
                      className="flex-1"
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((_month, i) => (
                  <Skeleton key={i} className="h-3 w-8" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Chart Skeleton */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48">
              {/* Pie chart skeleton */}
              <div className="relative">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="absolute inset-4">
                  <Skeleton className="h-32 w-32 rounded-full bg-background" />
                </div>
              </div>
            </div>
            {/* Legend skeleton */}
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table Skeleton */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 pb-3 border-b">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-5 gap-4 py-3 items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
