import AppShell from '@/components/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8 space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>

        {/* Accounts Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-7 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

