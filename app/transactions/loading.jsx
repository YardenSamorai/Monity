import AppShell from '@/components/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'

export default function TransactionsLoading() {
  return (
    <AppShell>
      <div className="min-h-screen p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
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
    </AppShell>
  )
}

