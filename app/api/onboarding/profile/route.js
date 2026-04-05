import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const user = await getOrCreateUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, language, currency, monthStartDay } = body

    // Update profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || null,
        preferredLanguage: language || 'en',
        preferredCurrency: currency || 'USD',
        monthStartDay: monthStartDay || 1,
      },
    })

    return NextResponse.json({ 
      success: true,
      user: {
        name: updatedUser.name,
        preferredLanguage: updatedUser.preferredLanguage,
        preferredCurrency: updatedUser.preferredCurrency,
        monthStartDay: updatedUser.monthStartDay,
      }
    })
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}

