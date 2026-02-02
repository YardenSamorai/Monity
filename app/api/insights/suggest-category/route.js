import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { suggestCategory } from '@/lib/ai-insights'

// GET /api/insights/suggest-category?description=...&amount=...&type=...
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const description = searchParams.get('description')
    const amount = parseFloat(searchParams.get('amount') || '0')
    const type = searchParams.get('type') || 'expense'

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const suggestions = await suggestCategory(
      prisma,
      user.id,
      description,
      amount,
      type
    )

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error suggesting category:', error)
    return NextResponse.json(
      { error: 'Failed to suggest category' },
      { status: 500 }
    )
  }
}

