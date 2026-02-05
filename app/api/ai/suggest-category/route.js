import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { suggestCategory } from '@/lib/ai-insights'

// POST /api/ai/suggest-category - Get smart category suggestions
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { description, amount, type } = await request.json()

    // Allow amount-only searches (amount > 0 even without description)
    if (!description && (!amount || Number(amount) <= 0)) {
      return NextResponse.json({ suggestions: [] })
    }

    console.log('[suggest-category] Input:', { description, amount, type })

    const suggestions = await suggestCategory(
      prisma,
      user.id,
      description || '',
      Number(amount) || 0,
      type || 'expense'
    )

    console.log('[suggest-category] Found:', suggestions.length, 'suggestions')

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error getting category suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to get suggestions', suggestions: [] },
      { status: 500 }
    )
  }
}
