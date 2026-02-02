import AppShell from '@/components/AppShell'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6 space-y-6">
        <SkeletonCard className="h-8 w-64 mb-2" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </AppShell>
  )
}

