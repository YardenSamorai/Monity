import AppShell from '@/components/AppShell'

function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-[rgb(var(--border-primary))] rounded ${className}`} />
  )
}

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="w-full px-4 py-4 lg:px-6 lg:py-6">
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          
          {/* Summary Skeleton - 8 cols */}
          <div className="col-span-12 lg:col-span-8 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-12 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-[rgb(var(--border-secondary))] border-t border-[rgb(var(--border-secondary))] bg-[rgb(var(--bg-primary))]">
              {[1, 2, 3].map(i => (
                <div key={i} className="px-3 lg:px-5 py-3">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Accounts Skeleton - 4 cols */}
          <div className="col-span-12 lg:col-span-4 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Insights Header */}
          <div className="col-span-12 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Insight Cards - 2x2 grid */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-span-12 sm:col-span-6 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}

          {/* Transactions Skeleton - 8 cols */}
          <div className="col-span-12 lg:col-span-8 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton - 4 cols */}
          <div className="col-span-12 lg:col-span-4 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[rgb(var(--border-secondary))]">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
