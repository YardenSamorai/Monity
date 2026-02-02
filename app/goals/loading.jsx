import AppShell from '@/components/AppShell'

function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-[rgb(var(--border-primary))] rounded ${className}`} />
  )
}

export default function GoalsLoading() {
  return (
    <AppShell>
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md hidden sm:block" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="mb-4">
                <Skeleton className="h-8 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-4" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
