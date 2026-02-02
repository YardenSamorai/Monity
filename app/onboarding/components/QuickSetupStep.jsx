'use client'

import { useState } from 'react'
import { Zap, DollarSign, CreditCard, ArrowRight, ArrowLeft, Plus, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { cn } from '@/lib/utils'

export function QuickSetupStep({ onNext, onBack, onSkip, account, categories, currency, currencySymbol }) {
  const { t, isRTL } = useI18n()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  
  const [recurringIncome, setRecurringIncome] = useState(null)
  const [recurringExpenses, setRecurringExpenses] = useState([])

  const [incomeForm, setIncomeForm] = useState({
    description: '',
    amount: '',
    dayOfMonth: '10',
  })

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    dayOfMonth: '1',
    categoryId: '',
  })

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  const handleAddIncome = async () => {
    if (!incomeForm.description.trim() || !incomeForm.amount) {
      toast.error(t('onboarding.quickSetup.fillAllFields'))
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/recurring-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: incomeForm.description.trim(),
          amount: Number(incomeForm.amount),
          dayOfMonth: Number(incomeForm.dayOfMonth),
          accountId: account.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to create recurring income')

      const data = await response.json()
      setRecurringIncome({
        ...data.recurringIncome,
        amount: Number(incomeForm.amount),
        description: incomeForm.description,
      })
      setShowIncomeForm(false)
      setIncomeForm({ description: '', amount: '', dayOfMonth: '10' })
      toast.success(t('onboarding.quickSetup.incomeAdded'))
    } catch (error) {
      toast.error(t('common.error'), error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!expenseForm.description.trim() || !expenseForm.amount) {
      toast.error(t('onboarding.quickSetup.fillAllFields'))
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/recurring-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseForm.description.trim(),
          amount: Number(expenseForm.amount),
          dayOfMonth: Number(expenseForm.dayOfMonth),
          accountId: account.id,
          categoryId: expenseForm.categoryId || null,
          type: 'expense',
        }),
      })

      if (!response.ok) throw new Error('Failed to create recurring expense')

      const data = await response.json()
      setRecurringExpenses(prev => [...prev, {
        ...data.recurringTransaction,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
      }])
      setShowExpenseForm(false)
      setExpenseForm({ description: '', amount: '', dayOfMonth: '1', categoryId: '' })
      toast.success(t('onboarding.quickSetup.expenseAdded'))
    } catch (error) {
      toast.error(t('common.error'), error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    onNext({ recurringIncome, recurringExpenses })
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-[rgb(var(--positive))]/10 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-6 h-6 text-[rgb(var(--positive))]" />
        </div>
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
          {t('onboarding.quickSetup.title')}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {t('onboarding.quickSetup.subtitle')}
        </p>
      </div>

      {/* Recurring Income Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[rgb(var(--positive))]" />
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('onboarding.quickSetup.recurringIncome')}
            </h3>
          </div>
        </div>

        {recurringIncome ? (
          <div className="p-4 rounded-xl bg-[rgb(var(--positive))]/5 border border-[rgb(var(--positive))]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--positive))] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[rgb(var(--text-primary))]">{recurringIncome.description}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('onboarding.quickSetup.dayOfMonth', { day: recurringIncome.dayOfMonth || incomeForm.dayOfMonth })}
                  </p>
                </div>
              </div>
              <span className="font-bold text-[rgb(var(--positive))]" dir="ltr">
                +{currencySymbol}{recurringIncome.amount.toLocaleString()}
              </span>
            </div>
          </div>
        ) : showIncomeForm ? (
          <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] space-y-3">
            <input
              type="text"
              value={incomeForm.description}
              onChange={(e) => setIncomeForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('onboarding.quickSetup.incomeDescription')}
              className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
                  style={{ paddingInlineStart: '2rem' }}
                  dir="ltr"
                />
              </div>
              <select
                value={incomeForm.dayOfMonth}
                onChange={(e) => setIncomeForm(prev => ({ ...prev, dayOfMonth: e.target.value }))}
                className="w-20 px-2 py-2.5 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
              >
                {[...Array(28)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowIncomeForm(false)}
                className="flex-1 py-2 rounded-lg border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-secondary))]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddIncome}
                disabled={isLoading}
                className="flex-1 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium disabled:opacity-50"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowIncomeForm(true)}
            className="w-full p-4 rounded-xl border-2 border-dashed border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('onboarding.quickSetup.addIncome')}
          </button>
        )}
      </div>

      {/* Recurring Expenses Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[rgb(var(--negative))]" />
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('onboarding.quickSetup.recurringExpenses')}
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {recurringExpenses.map((expense, index) => (
            <div key={index} className="p-3 rounded-xl bg-[rgb(var(--negative))]/5 border border-[rgb(var(--negative))]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[rgb(var(--negative))] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-medium text-sm text-[rgb(var(--text-primary))]">{expense.description}</span>
                </div>
                <span className="font-bold text-sm text-[rgb(var(--negative))]" dir="ltr">
                  -{currencySymbol}{expense.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {showExpenseForm ? (
            <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] space-y-3">
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('onboarding.quickSetup.expenseDescription')}
                className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
                    style={{ paddingInlineStart: '2rem' }}
                    dir="ltr"
                  />
                </div>
                <select
                  value={expenseForm.dayOfMonth}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, dayOfMonth: e.target.value }))}
                  className="w-20 px-2 py-2.5 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
                >
                  {[...Array(28)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              {expenseCategories.length > 0 && (
                <select
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
                >
                  <option value="">{t('onboarding.quickSetup.selectCategory')}</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExpenseForm(false)}
                  className="flex-1 py-2 rounded-lg border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-secondary))]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={isLoading}
                  className="flex-1 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium disabled:opacity-50"
                >
                  {t('common.add')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('onboarding.quickSetup.addExpense')}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] font-medium flex items-center justify-center gap-2 hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            <ArrowLeft className={cn("w-4 h-4", isRTL && "rtl-flip")} />
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-[2] py-3 px-4 rounded-xl bg-[rgb(var(--accent))] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {t('common.continue')}
            <ArrowRight className={cn("w-4 h-4", isRTL && "rtl-flip")} />
          </button>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-[rgb(var(--text-tertiary))] text-sm font-medium hover:text-[rgb(var(--text-secondary))] transition-colors"
        >
          {t('onboarding.quickSetup.skip')}
        </button>
      </div>
    </div>
  )
}
