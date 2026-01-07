import { z } from 'zod'

// Transaction validations
export const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  date: z.string().datetime(),
  notes: z.string().max(1000).optional().nullable(),
  transferToAccountId: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
})

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string(),
})

// Budget validations
export const createBudgetSchema = z.object({
  categoryId: z.string().nullable().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().nonnegative(),
})

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  id: z.string(),
})

// Account validations
export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['bank', 'cash', 'credit']),
  balance: z.number().default(0),
  currency: z.string().default('USD'),
})

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string(),
})

// Category validations
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['income', 'expense', 'both']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  icon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string(),
})

// Savings goal validations
export const createSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  targetDate: z.string().datetime().optional().nullable(),
})

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial().extend({
  id: z.string(),
})

// iPhone Shortcut webhook validation
export const shortcutWebhookSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string().optional(),
  account: z.string().optional(),
  date: z.string().datetime().optional(),
  idempotencyKey: z.string().min(1),
})

