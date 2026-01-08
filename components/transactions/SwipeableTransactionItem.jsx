'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'
import { Edit, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

const SWIPE_THRESHOLD = 80 // Minimum distance to trigger action
const ACTION_WIDTH = 80 // Width of action buttons

export function SwipeableTransactionItem({ 
  transaction, 
  onEdit, 
  onDelete,
  currencySymbol,
  localeString 
}) {
  const { isRTL } = useI18n()
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const itemRef = useRef(null)

  // Reset position when transaction changes
  useEffect(() => {
    setTranslateX(0)
  }, [transaction.id])

  const handleStart = (clientX) => {
    setIsDragging(true)
    setStartX(clientX)
    setCurrentX(clientX)
  }

  const handleMove = (clientX) => {
    if (!isDragging) return
    
    const deltaX = clientX - startX
    
    // Limit swipe distance - same direction in both LTR and RTL
    const maxSwipe = ACTION_WIDTH * 2
    const minSwipe = -ACTION_WIDTH * 2
    
    const newTranslateX = Math.max(minSwipe, Math.min(maxSwipe, deltaX))
    setTranslateX(newTranslateX)
    setCurrentX(clientX)
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    // Determine which action to trigger based on swipe direction
    // Swipe right (positive translateX) → Delete
    // Swipe left (negative translateX) → Edit
    // Same behavior in both LTR and RTL
    
    if (translateX > SWIPE_THRESHOLD) {
      // Swiped in delete direction
      onDelete(transaction)
      setTranslateX(0)
    } else if (translateX < -SWIPE_THRESHOLD) {
      // Swiped in edit direction
      onEdit(transaction)
      setTranslateX(0)
    } else {
      // Snap back
      setTranslateX(0)
    }
  }

  // Touch events
  const handleTouchStart = (e) => {
    e.preventDefault()
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    handleEnd()
  }

  // Mouse events (for desktop testing)
  const handleMouseDown = (e) => {
    e.preventDefault()
    handleStart(e.clientX)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    handleMove(e.clientX)
  }

  const handleMouseUp = (e) => {
    e.preventDefault()
    handleEnd()
  }

  useEffect(() => {
    if (!isDragging) return
    
    const handleGlobalMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - startX
      const maxSwipe = ACTION_WIDTH * 2
      const minSwipe = -ACTION_WIDTH * 2
      const newTranslateX = Math.max(minSwipe, Math.min(maxSwipe, deltaX))
      setTranslateX(newTranslateX)
    }
    
    const handleGlobalMouseUp = () => {
      if (!isDragging) return
      setIsDragging(false)
      
      if (translateX > SWIPE_THRESHOLD) {
        onDelete(transaction)
        setTranslateX(0)
      } else if (translateX < -SWIPE_THRESHOLD) {
        onEdit(transaction)
        setTranslateX(0)
      } else {
        setTranslateX(0)
      }
    }
    
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, startX, translateX, transaction, onDelete, onEdit, isRTL])

  // Determine which action icons to show
  // translateX > 0 means swiped right (element moved right) → Delete (left side revealed)
  // translateX < 0 means swiped left (element moved left) → Edit (right side revealed)
  // Physical swipe direction is the same in both LTR and RTL - no need to swap icons
  const showDeleteAction = translateX > 0
  const showEditAction = translateX < 0

  // Calculate action button opacity based on swipe distance
  const deleteOpacity = showDeleteAction ? Math.min(1, Math.abs(translateX) / ACTION_WIDTH) : 0
  const editOpacity = showEditAction ? Math.min(1, Math.abs(translateX) / ACTION_WIDTH) : 0

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ minHeight: '80px', direction: 'ltr' }}>
      {/* Action Buttons Background - Behind the item, always LTR for consistent swipe behavior */}
      <div className="absolute inset-0 flex z-0">
        {/* Delete Action - Always on left, revealed when swiping right (translateX > 0) */}
        <div 
          className="flex items-center justify-center transition-opacity duration-200"
          style={{ 
            width: ACTION_WIDTH,
            minWidth: ACTION_WIDTH,
            opacity: deleteOpacity,
            backgroundColor: 'rgb(239, 68, 68)', // red-500
            padding: '0 1rem',
            justifyContent: 'center',
            pointerEvents: deleteOpacity > 0 ? 'auto' : 'none',
          }}
        >
          <Trash2 className="w-6 h-6 text-white" />
        </div>

        {/* Spacer in middle */}
        <div className="flex-1" />

        {/* Edit Action - Always on right, revealed when swiping left (translateX < 0) */}
        <div 
          className="flex items-center justify-center transition-opacity duration-200"
          style={{ 
            width: ACTION_WIDTH,
            minWidth: ACTION_WIDTH,
            opacity: editOpacity,
            backgroundColor: 'rgb(59, 130, 246)', // blue-500
            padding: '0 1rem',
            justifyContent: 'center',
            pointerEvents: editOpacity > 0 ? 'auto' : 'none',
          }}
        >
          <Edit className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Transaction Item - On top, moves to reveal icons */}
      <div
        ref={itemRef}
        className={cn(
          "relative bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border rounded-xl transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing z-10",
          isDragging && "transition-none"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
          touchAction: 'pan-x',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between py-4 px-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
          <div className="flex-1 min-w-0" style={{ paddingInlineEnd: '1rem' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary truncate">
                {transaction.description}
              </span>
              {transaction.category && (
                <Badge variant="default" className="flex-shrink-0">
                  {transaction.category.name}
                </Badge>
              )}
            </div>
            <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              {new Date(transaction.date).toLocaleDateString(localeString, { day: 'numeric', month: 'short' })} • {transaction.account.name}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div
              className={cn(
                "font-semibold whitespace-nowrap",
                transaction.type === 'income'
                  ? 'text-light-success dark:text-dark-success'
                  : 'text-light-danger dark:text-dark-danger'
              )}
              dir="ltr"
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(Number(transaction.amount), { locale: localeString, symbol: currencySymbol })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

