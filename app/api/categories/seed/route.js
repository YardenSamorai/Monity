import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default categories
const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'מזון ומסעדות', type: 'expense', icon: '🍔', color: '#EF4444' },
  { name: 'קניות', type: 'expense', icon: '🛒', color: '#F97316' },
  { name: 'תחבורה', type: 'expense', icon: '🚗', color: '#EAB308' },
  { name: 'בילויים ופנאי', type: 'expense', icon: '🎬', color: '#A855F7' },
  { name: 'חשבונות ותשלומים', type: 'expense', icon: '📄', color: '#6366F1' },
  { name: 'בריאות', type: 'expense', icon: '💊', color: '#EC4899' },
  { name: 'דיור', type: 'expense', icon: '🏠', color: '#14B8A6' },
  { name: 'ביגוד', type: 'expense', icon: '👕', color: '#F472B6' },
  { name: 'חינוך', type: 'expense', icon: '📚', color: '#0EA5E9' },
  { name: 'מתנות ותרומות', type: 'expense', icon: '🎁', color: '#10B981' },
  { name: 'חיות מחמד', type: 'expense', icon: '🐕', color: '#84CC16' },
  { name: 'טיפוח', type: 'expense', icon: '💅', color: '#D946EF' },
  { name: 'ביטוחים', type: 'expense', icon: '🛡️', color: '#64748B' },
  { name: 'מיסים', type: 'expense', icon: '🏛️', color: '#78716C' },
  { name: 'אחר', type: 'expense', icon: '📦', color: '#94A3B8' },
  
  // Income categories
  { name: 'משכורת', type: 'income', icon: '💰', color: '#22C55E' },
  { name: 'בונוס', type: 'income', icon: '🎉', color: '#10B981' },
  { name: 'פרילנס', type: 'income', icon: '💻', color: '#06B6D4' },
  { name: 'השקעות', type: 'income', icon: '📈', color: '#8B5CF6' },
  { name: 'מתנות', type: 'income', icon: '🎀', color: '#F43F5E' },
  { name: 'החזרים', type: 'income', icon: '↩️', color: '#0EA5E9' },
  { name: 'הכנסה אחרת', type: 'income', icon: '💵', color: '#84CC16' },
]

export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has categories
    const existingCategories = await prisma.category.count({
      where: { userId: user.id }
    })

    if (existingCategories > 0) {
      return NextResponse.json({ 
        message: 'User already has categories',
        count: existingCategories 
      })
    }

    // Create default categories
    const categories = DEFAULT_CATEGORIES.map(cat => ({
      userId: user.id,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    }))
    
    const result = await prisma.category.createMany({
      data: categories,
      skipDuplicates: true,
    })

    return NextResponse.json({ 
      message: 'Default categories created',
      count: result.count 
    })
  } catch (error) {
    console.error('Error seeding categories:', error)
    return NextResponse.json({ error: 'Failed to seed categories' }, { status: 500 })
  }
}
