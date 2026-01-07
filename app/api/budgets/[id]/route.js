import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBudgetSchema } from '@/lib/validations'

// PUT /api/budgets/[id] - Update budget
export async function PUT(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    // Validate only the fields that can be updated
    const validated = createBudgetSchema.partial().parse(body)

    const budget = await prisma.budget.findFirst({
      where: { 
        id,
        userId: user.id,
      },
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        categoryId: validated.categoryId !== undefined ? validated.categoryId : budget.categoryId,
        amount: validated.amount !== undefined ? validated.amount : budget.amount,
        month: validated.month !== undefined ? validated.month : budget.month,
        year: validated.year !== undefined ? validated.year : budget.year,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ budget: updated })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

// DELETE /api/budgets/[id] - Delete budget
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const budget = await prisma.budget.findFirst({
      where: { 
        id,
        userId: user.id,
      },
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    await prisma.budget.delete({
      where: { id },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Budget deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}

