import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCategorySchema } from '@/lib/validations'

// PUT /api/categories/[id] - Update category
export async function PUT(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = createCategorySchema.parse(body)

    // For default categories, userId is null, so we need to check differently
    const category = await prisma.category.findFirst({
      where: { 
        id,
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: validated.name,
        type: validated.type,
        color: validated.color,
        icon: validated.icon,
        parentId: validated.parentId,
      },
    })

    return NextResponse.json({ category: updated })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // For default categories, userId is null, so we need to check differently
    const category = await prisma.category.findFirst({
      where: { 
        id,
        OR: [
          { userId: user.id },
          { isDefault: true },
        ],
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category is being used by this user
    const [transactionsCount, budgetsCount, recurringIncomesCount, recurringTransactionsCount] = await Promise.all([
      prisma.transaction.count({
        where: { categoryId: id, userId: user.id },
      }),
      prisma.budget.count({
        where: { categoryId: id, userId: user.id },
      }),
      prisma.recurringIncome.count({
        where: { categoryId: id, userId: user.id },
      }),
      prisma.recurringTransaction.count({
        where: { categoryId: id, userId: user.id },
      }),
    ])

    const isUsed = 
      transactionsCount > 0 ||
      budgetsCount > 0 ||
      recurringIncomesCount > 0 ||
      recurringTransactionsCount > 0

    if (isUsed) {
      return NextResponse.json(
        { 
          error: 'Category is in use',
          message: 'Cannot delete category that is being used in transactions, budgets, or recurring items',
        },
        { status: 400 }
      )
    }

    // For default categories, we need to check if they can be deleted
    // Default categories are shared, so we need to be careful
    // For now, we'll allow deletion of default categories if they're not in use
    try {
      // Delete the category
      await prisma.category.delete({
        where: { id },
      })
    } catch (deleteError) {
      // If it's a unique constraint error, the category might be referenced elsewhere
      if (deleteError.code === 'P2003') {
        return NextResponse.json(
          { 
            error: 'Category is in use',
            message: 'Cannot delete category that is being used',
          },
          { status: 400 }
        )
      }
      throw deleteError
    }

    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

