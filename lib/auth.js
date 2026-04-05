import { headers, cookies } from 'next/headers'
import { prisma } from './prisma'

const DEFAULT_CATEGORIES = [
  { name: 'מזון ומסעדות', nameEn: 'Food & Dining', type: 'expense', icon: '🍔', color: '#EF4444' },
  { name: 'קניות', nameEn: 'Shopping', type: 'expense', icon: '🛒', color: '#F97316' },
  { name: 'תחבורה', nameEn: 'Transportation', type: 'expense', icon: '🚗', color: '#EAB308' },
  { name: 'בילויים ופנאי', nameEn: 'Entertainment', type: 'expense', icon: '🎬', color: '#A855F7' },
  { name: 'חשבונות ותשלומים', nameEn: 'Bills & Utilities', type: 'expense', icon: '📄', color: '#6366F1' },
  { name: 'בריאות', nameEn: 'Health', type: 'expense', icon: '💊', color: '#EC4899' },
  { name: 'דיור', nameEn: 'Housing', type: 'expense', icon: '🏠', color: '#14B8A6' },
  { name: 'ביגוד', nameEn: 'Clothing', type: 'expense', icon: '👕', color: '#F472B6' },
  { name: 'חינוך', nameEn: 'Education', type: 'expense', icon: '📚', color: '#0EA5E9' },
  { name: 'מתנות ותרומות', nameEn: 'Gifts & Donations', type: 'expense', icon: '🎁', color: '#10B981' },
  { name: 'חיות מחמד', nameEn: 'Pets', type: 'expense', icon: '🐕', color: '#84CC16' },
  { name: 'טיפוח', nameEn: 'Personal Care', type: 'expense', icon: '💅', color: '#D946EF' },
  { name: 'ביטוחים', nameEn: 'Insurance', type: 'expense', icon: '🛡️', color: '#64748B' },
  { name: 'מיסים', nameEn: 'Taxes', type: 'expense', icon: '🏛️', color: '#78716C' },
  { name: 'אחר', nameEn: 'Other', type: 'expense', icon: '📦', color: '#94A3B8' },
  { name: 'משכורת', nameEn: 'Salary', type: 'income', icon: '💰', color: '#22C55E' },
  { name: 'בונוס', nameEn: 'Bonus', type: 'income', icon: '🎉', color: '#10B981' },
  { name: 'פרילנס', nameEn: 'Freelance', type: 'income', icon: '💻', color: '#06B6D4' },
  { name: 'השקעות', nameEn: 'Investments', type: 'income', icon: '📈', color: '#8B5CF6' },
  { name: 'מתנות', nameEn: 'Gifts Received', type: 'income', icon: '🎀', color: '#F43F5E' },
  { name: 'החזרים', nameEn: 'Refunds', type: 'income', icon: '↩️', color: '#0EA5E9' },
  { name: 'הכנסה אחרת', nameEn: 'Other Income', type: 'income', icon: '💵', color: '#84CC16' },
]

export async function createDefaultCategories(userId) {
  try {
    const existingCount = await prisma.category.count({ where: { userId } })
    if (existingCount > 0) return

    const categories = DEFAULT_CATEGORIES.map(cat => ({
      userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    }))

    await prisma.category.createMany({ data: categories, skipDuplicates: true })
  } catch (error) {
    console.error('Error creating default categories:', error)
  }
}

/**
 * Resolve token from Authorization header or session cookie.
 * Returns the user if valid, null otherwise.
 */
async function resolveUser() {
  try {
    const headersList = await headers()
    const cookieStore = await cookies()

    // 1. Try Bearer token from Authorization header (API / mobile)
    const authHeader = headersList.get('authorization')
    let token = null

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // 2. Fallback: session cookie (web browser)
    if (!token) {
      token = cookieStore.get('session_token')?.value
    }

    if (!token) return null

    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!apiToken || !apiToken.isActive) return null
    if (apiToken.expiresAt && new Date(apiToken.expiresAt) < new Date()) return null

    prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})

    return apiToken.user
  } catch {
    return null
  }
}

/**
 * Get the current authenticated user from token (header or cookie).
 */
export async function getOrCreateUser() {
  return resolveUser()
}

/**
 * Get current user ID.
 */
export async function getCurrentUserId() {
  const user = await resolveUser()
  return user?.id || null
}
