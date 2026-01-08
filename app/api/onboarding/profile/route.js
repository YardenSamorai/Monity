import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, language, currency, monthStartDay } = body

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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

