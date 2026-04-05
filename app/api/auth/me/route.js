import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
      },
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
