import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Table skeleton */}
      <div className="border rounded-lg">
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-40 flex-1" />
            <Skeleton className="h-4 w-24 flex-1" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="divide-y">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4 items-center">
              <Skeleton className="h-4 w-32 flex-1" />
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-4 w-24 flex-1" />
              <Skeleton className="h-4 w-32 flex-1" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MapSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex gap-4">
        <div className="w-80 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="flex-1 h-[600px] rounded-lg" />
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-48" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  )
}
