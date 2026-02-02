import AppShell from '@/components/AppShell'

function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-[rgb(var(--border-primary))] rounded ${className}`} />
  )
}

export default function BudgetLoading() {
  return (
    <AppShell>
      <div className="px-4 py-4 pb-24">
        
        {/* Header */}
        <div className="text-center mb-5">
          <Skeleton className="h-5 w-20 mx-auto mb-2" />
          <Skeleton className="h-4 w-28 mx-auto" />
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 text-center">
              <Skeleton className="h-2.5 w-12 mx-auto mb-2" />
              <Skeleton className="h-5 w-16 mx-auto mb-1" />
              <Skeleton className="h-2 w-10 mx-auto" />
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 mb-5">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Budget Items */}
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-28" />
                <div className="flex gap-1">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-2" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
