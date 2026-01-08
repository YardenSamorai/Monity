import AppShell from '@/components/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'

export default function BudgetLoading() {
  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full mb-2" />
              <div className="flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

