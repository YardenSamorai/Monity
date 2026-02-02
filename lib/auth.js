import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

// Default categories for new users
const DEFAULT_CATEGORIES = [
  // Expense categories
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
  
  // Income categories
  { name: 'משכורת', nameEn: 'Salary', type: 'income', icon: '💰', color: '#22C55E' },
  { name: 'בונוס', nameEn: 'Bonus', type: 'income', icon: '🎉', color: '#10B981' },
  { name: 'פרילנס', nameEn: 'Freelance', type: 'income', icon: '💻', color: '#06B6D4' },
  { name: 'השקעות', nameEn: 'Investments', type: 'income', icon: '📈', color: '#8B5CF6' },
  { name: 'מתנות', nameEn: 'Gifts Received', type: 'income', icon: '🎀', color: '#F43F5E' },
  { name: 'החזרים', nameEn: 'Refunds', type: 'income', icon: '↩️', color: '#0EA5E9' },
  { name: 'הכנסה אחרת', nameEn: 'Other Income', type: 'income', icon: '💵', color: '#84CC16' },
]

/**
 * Create default categories for a new user
 */
async function createDefaultCategories(userId) {
  try {
    // First check if user already has categories
    const existingCount = await prisma.category.count({
      where: { userId }
    })
    
    if (existingCount > 0) {
      console.log(`User ${userId} already has ${existingCount} categories, skipping default creation`)
      return
    }
    
    const categories = DEFAULT_CATEGORIES.map(cat => ({
      userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    }))
    
    await prisma.category.createMany({
      data: categories,
      skipDuplicates: true,
    })
    
    console.log(`Created ${categories.length} default categories for user:`, userId)
  } catch (error) {
    console.error('Error creating default categories:', error)
    // Don't throw - this shouldn't block user creation
  }
}

/**
 * Get or create user in database from Clerk session
 * No caching to avoid stale data issues after DB resets
 */
export async function getOrCreateUser() {
  try {
    const authResult = await auth()
    const { userId } = authResult || {}
    
    if (!userId) {
      return null
    }
    
    // Always check the database - no caching to avoid stale data
    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })
    
    if (!user) {
      // Only fetch Clerk user data when creating new user
      const clerkUser = await currentUser()
      
      try {
        user = await prisma.user.create({
          data: {
            clerkUserId: userId,
            email: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
            name: clerkUser?.firstName 
              ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
              : null,
          },
        })
        console.log('Created new user:', user.id)
        
        // Create default categories for new user
        await createDefaultCategories(user.id)
        
      } catch (createError) {
        // If user was created by another concurrent request, try to find it
        if (createError.code === 'P2002') {
          user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
          })
        } else {
          throw createError
        }
      }
    }
    
    return user
  } catch (error) {
    console.error('Error in getOrCreateUser:', error)
    return null
  }
}

/**
 * Get current user ID from Clerk
 */
export async function getCurrentUserId() {
  try {
    const authResult = await auth()
    return authResult?.userId || null
  } catch (error) {
    console.error('Error in getCurrentUserId:', error)
    return null
  }
}
