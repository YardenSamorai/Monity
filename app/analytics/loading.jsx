import AppShell from '@/components/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AnalyticsLoading() {
  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="p-6 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-48 w-full rounded-full" />
          </div>
          <div className="p-6 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

