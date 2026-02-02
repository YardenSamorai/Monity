'use client'

import { Badge } from '@/components/ui/Badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TagBadge({ tag, onRemove, className }) {
  return (
    <Badge
      variant="default"
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs',
        className
      )}
      style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag.id)
          }}
          className="ml-1 hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Badge>
  )
}

