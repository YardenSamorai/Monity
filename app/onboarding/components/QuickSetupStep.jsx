'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, DollarSign, CreditCard, ArrowRight, ArrowLeft, Plus, Check, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { translations } from '@/lib/translations'

export function QuickSetupStep({ onNext, onBack, onSkip, account, categories, currency, currencySymbol }) {
  const { t, isRTL, locale } = useI18n()
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

  // Filter expense categories
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  }

  // Get translated category name
  const getCategoryName = (category) => {
    if (category.isDefault) {
      const categoryTranslations = translations[locale]?.settings?.categoryNames
      if (categoryTranslations && categoryTranslations[category.name]) {
        return categoryTranslations[category.name]
      }
    }
    return category.name
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-8 mt-8 lg:mt-0">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
          {t('onboarding.quickSetup.title')}
        </h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary max-w-sm mx-auto">
          {t('onboarding.quickSetup.subtitle')}
        </p>
      </motion.div>

      {/* Recurring Income Card */}
      <motion.div variants={itemVariants} className="mb-4">
        <div className="p-4 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                {t('onboarding.quickSetup.recurringIncome')}
              </h3>
              <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                {t('onboarding.quickSetup.incomeDescription')}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {recurringIncome ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                    {recurringIncome.description}
                  </span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400" dir="ltr">
                  {currencySymbol}{Number(recurringIncome.amount).toLocaleString()}
                </span>
              </motion.div>
            ) : showIncomeForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('onboarding.quickSetup.incomeNamePlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-tertiary text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      dir="ltr"
                    />
                  </div>
                  <select
                    value={incomeForm.dayOfMonth}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, dayOfMonth: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {t('onboarding.quickSetup.dayOfMonth', { day: i + 1 })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowIncomeForm(false)}
                    className="flex-1 py-2 px-4 rounded-xl bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddIncome}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 rounded-xl bg-emerald-500 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {isLoading ? '...' : t('common.add')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowIncomeForm(true)}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2 hover:bg-emerald-500/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('onboarding.quickSetup.addIncome')}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Recurring Expenses Card */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="p-4 rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                {t('onboarding.quickSetup.recurringExpenses')}
              </h3>
              <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                {t('onboarding.quickSetup.expensesDescription')}
              </p>
            </div>
          </div>

          {/* Added expenses list */}
          {recurringExpenses.length > 0 && (
            <div className="space-y-2 mb-3">
              {recurringExpenses.map((expense, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-rose-500" />
                    <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      {expense.description}
                    </span>
                  </div>
                  <span className="font-semibold text-rose-600 dark:text-rose-400" dir="ltr">
                    {currencySymbol}{Number(expense.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {showExpenseForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('onboarding.quickSetup.expenseNamePlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-tertiary text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      dir="ltr"
                    />
                  </div>
                  <select
                    value={expenseForm.dayOfMonth}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, dayOfMonth: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {t('onboarding.quickSetup.dayOfMonth', { day: i + 1 })}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">{t('onboarding.quickSetup.selectCategory')}</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{getCategoryName(cat)}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="flex-1 py-2 px-4 rounded-xl bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary text-sm font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExpense}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 rounded-xl bg-rose-500 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {isLoading ? '...' : t('common.add')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowExpenseForm(true)}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-2 hover:bg-rose-500/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('onboarding.quickSetup.addExpense')}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3.5 px-6 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-[2] py-3.5 px-6 rounded-xl bg-gradient-to-r from-light-accent to-blue-600 dark:from-dark-accent dark:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-light-accent/20 dark:shadow-dark-accent/20"
          >
            {t('common.continue')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-medium hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors"
        >
          {t('onboarding.quickSetup.skip')}
        </button>
      </motion.div>
    </motion.div>
  )
}

