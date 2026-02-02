import AppShell from '@/components/AppShell'

function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-[rgb(var(--border-primary))] rounded ${className}`} />
  )
}

export default function TransactionsLoading() {
  return (
    <AppShell>
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        {/* Header */}
        <div className="mb-6">
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-6">
          {[1, 2].map(group => (
            <div key={group}>
              <Skeleton className="h-3 w-24 mb-2" />
              <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden divide-y divide-[rgb(var(--border-secondary))]">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
