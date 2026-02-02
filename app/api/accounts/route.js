import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAccountSchema } from '@/lib/validations'

// GET /api/accounts - List accounts
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })
    
    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

// POST /api/accounts - Create account
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify user exists in database before creating account
    const userExists = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true }
    })
    
    if (!userExists) {
      console.error('User not found in database despite getOrCreateUser returning:', user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const body = await request.json()
    const validated = createAccountSchema.parse(body)
    
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: validated.name,
        type: validated.type,
        balance: validated.balance,
        currency: validated.currency,
      },
    })
    
    // Revalidate cache
    revalidateTag('dashboard')
    revalidateTag('transactions')
    
    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

