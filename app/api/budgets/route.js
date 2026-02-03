import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBudgetSchema } from '@/lib/validations'
import { notifyBudgetChange } from '@/lib/pusher'

// GET /api/budgets - List budgets
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    const where = { userId: user.id }
    
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    
    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })
    
    return NextResponse.json({ budgets })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

// POST /api/budgets - Create budget
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validated = createBudgetSchema.parse(body)
    
    // Check if budget already exists
    const existing = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId: validated.categoryId || null,
          month: validated.month,
          year: validated.year,
        },
      },
    })
    
    if (existing) {
      // Update existing budget
      const budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: validated.amount },
        include: { category: true },
      })
      
      // Revalidate cache and notify
      revalidateTag('budgets')
      revalidateTag('dashboard')
      notifyBudgetChange(user.id, 'updated', budget).catch(() => {})
      
      return NextResponse.json({ budget })
    }
    
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: validated.categoryId,
        month: validated.month,
        year: validated.year,
        amount: validated.amount,
      },
      include: {
        category: true,
      },
    })
    
    // Revalidate cache and notify
    revalidateTag('budgets')
    revalidateTag('dashboard')
    notifyBudgetChange(user.id, 'created', budget).catch(() => {})
    
    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}

