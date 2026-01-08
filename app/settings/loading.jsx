import AppShell from '@/components/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8 space-y-6">
        {/* Header */}
        <Skeleton className="h-10 w-48 mb-6" />
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-light-border dark:border-dark-border pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Another Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

