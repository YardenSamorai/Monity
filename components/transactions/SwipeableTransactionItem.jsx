'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'
import { Edit, Trash2, Target, ArrowUpCircle, ArrowDownCircle, TrendingUp, CreditCard } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

const SWIPE_THRESHOLD = 80
const ACTION_WIDTH = 80

export function SwipeableTransactionItem({ 
  transaction, 
  onEdit, 
  onDelete,
  onLinkGoal,
  onView,
  currencySymbol,
  localeString 
}) {
  const { isRTL, t } = useI18n()
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const itemRef = useRef(null)
  const tapHandledRef = useRef(false) // Prevent double-trigger on mobile

  useEffect(() => {
    setTranslateX(0)
  }, [transaction.id])

  const handleStart = (clientX) => {
    setIsDragging(true)
    setStartX(clientX)
  }

  const handleMove = (clientX) => {
    if (!isDragging) return
    
    const deltaX = clientX - startX
    const maxSwipe = ACTION_WIDTH * 2
    const minSwipe = -ACTION_WIDTH * 2
    const newTranslateX = Math.max(minSwipe, Math.min(maxSwipe, deltaX))
    setTranslateX(newTranslateX)
  }

  const handleEnd = () => {
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

  const handleTouchStart = (e) => {
    tapHandledRef.current = false
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    // Only prevent default if actually swiping (moved more than 5px)
    if (Math.abs(e.touches[0].clientX - startX) > 5) {
      e.preventDefault()
    }
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    // If barely moved, treat as tap (open details)
    if (Math.abs(translateX) < 10) {
      setIsDragging(false)
      setTranslateX(0)
      tapHandledRef.current = true
      onView?.(transaction)
      return
    }
    handleEnd()
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    tapHandledRef.current = false
    handleStart(e.clientX)
  }

  // Handle click to view transaction details (only if not swiping) - for desktop
  const handleClick = () => {
    // Prevent double-trigger if already handled by touch
    if (tapHandledRef.current) {
      tapHandledRef.current = false
      return
    }
    // This is mainly for desktop - mobile uses handleTouchEnd
    if (Math.abs(translateX) < 10 && !isDragging) {
      onView?.(transaction)
    }
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

  const showDeleteAction = translateX > 0
  const showEditAction = translateX < 0
  const deleteOpacity = showDeleteAction ? Math.min(1, Math.abs(translateX) / ACTION_WIDTH) : 0
  const editOpacity = showEditAction ? Math.min(1, Math.abs(translateX) / ACTION_WIDTH) : 0

  return (
    <div className="relative overflow-hidden" style={{ minHeight: '80px', direction: 'ltr' }}>
      {/* Action Buttons Background */}
      <div className="absolute inset-0 flex z-0">
        <div 
          className="flex items-center justify-center transition-opacity duration-200"
          style={{ 
            width: ACTION_WIDTH,
            minWidth: ACTION_WIDTH,
            opacity: deleteOpacity,
            backgroundColor: '#ef4444',
            pointerEvents: deleteOpacity > 0 ? 'auto' : 'none',
          }}
        >
          <Trash2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1" />
        <div 
          className="flex items-center justify-center transition-opacity duration-200"
          style={{ 
            width: ACTION_WIDTH,
            minWidth: ACTION_WIDTH,
            opacity: editOpacity,
            backgroundColor: '#3b82f6',
            pointerEvents: editOpacity > 0 ? 'auto' : 'none',
          }}
        >
          <Edit className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Transaction Item */}
      <div
        ref={itemRef}
        className={cn(
          "relative bg-white dark:bg-slate-900 transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing z-10",
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
        onClick={handleClick}
      >
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
          {/* Transaction Type Icon */}
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
            transaction.type === 'income'
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
              : transaction.type === 'transfer'
              ? 'bg-gradient-to-br from-blue-400 to-blue-600'
              : transaction.isCreditCard
              ? 'bg-gradient-to-br from-purple-400 to-purple-600'
              : 'bg-gradient-to-br from-rose-400 to-rose-600'
          )}>
            {transaction.type === 'income' ? (
              <ArrowUpCircle className="w-5 h-5 text-white" />
            ) : transaction.type === 'transfer' ? (
              <TrendingUp className="w-5 h-5 text-white" />
            ) : transaction.isCreditCard ? (
              <CreditCard className="w-5 h-5 text-white" />
            ) : (
              <ArrowDownCircle className="w-5 h-5 text-white" />
            )}
          </div>
          
          {/* Transaction Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {transaction.description}
              </span>
              {transaction.category && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                  {transaction.category.name}
                </span>
              )}
              {transaction.savingsGoal && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex-shrink-0 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {transaction.savingsGoal.name}
                </span>
              )}
              {transaction.isCreditCard && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 flex items-center gap-1",
                  transaction.creditCardStatus === 'pending'
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}>
                  <CreditCard className="w-3 h-3" />
                  {transaction.creditCardStatus === 'pending' ? t('creditCards.statusPending') : t('creditCards.statusBilled')}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(transaction.date).toLocaleDateString(localeString, { day: 'numeric', month: 'short' })} • {transaction.account.name}
            </div>
          </div>
          
          {/* Amount */}
          <div className="flex-shrink-0">
            <div
              className={cn(
                "font-bold text-lg tabular-nums whitespace-nowrap",
                transaction.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
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
