import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTransactionSchema } from '@/lib/validations'
import { suggestCategory } from '@/lib/ai-insights'
import { notifyDashboardUpdate, notifyHouseholdTransaction } from '@/lib/pusher'

// GET /api/transactions - List transactions
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    const type = searchParams.get('type')
    const accountId = searchParams.get('accountId')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search') // Full-text search
    
    // Check if user wants to see shared transactions
    const includeShared = searchParams.get('includeShared') === 'true'
    const onlyShared = searchParams.get('onlyShared') === 'true'
    
    // Get user's household if exists
    let householdId = null
    if (includeShared || onlyShared) {
      const member = await prisma.householdMember.findFirst({
        where: { userId: user.id },
        select: { householdId: true },
      })
      if (member) {
        householdId = member.householdId
      }
    }

    // Build base filters
    const baseFilters = {}
    if (type) baseFilters.type = type
    if (accountId) baseFilters.accountId = accountId
    if (categoryId) baseFilters.categoryId = categoryId
    if (startDate || endDate) {
      baseFilters.date = {}
      if (startDate) baseFilters.date.gte = new Date(startDate)
      if (endDate) baseFilters.date.lte = new Date(endDate)
    }
    if (minAmount || maxAmount) {
      baseFilters.amount = {}
      if (minAmount) baseFilters.amount.gte = Number(minAmount)
      if (maxAmount) baseFilters.amount.lte = Number(maxAmount)
    }
    // Full-text search in description and notes
    const searchFilter = search ? {
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ],
    } : null

    // Build where clause
    let where = {}
    
    if (onlyShared && householdId) {
      where = {
        householdId,
        isShared: true,
        ...baseFilters,
      }
      if (searchFilter) {
        where = {
          ...where,
          ...searchFilter,
        }
      }
    } else if (includeShared && householdId) {
      // Use OR for user's transactions OR shared household transactions
      where = {
        OR: [
          { userId: user.id, ...baseFilters },
          { householdId, isShared: true, ...baseFilters },
        ],
      }
      if (searchFilter) {
        where = {
          AND: [
            { OR: where.OR },
            searchFilter,
          ],
        }
      }
    } else {
      where = {
        userId: user.id,
        ...baseFilters,
      }
      if (searchFilter) {
        where = {
          ...where,
          ...searchFilter,
        }
      }
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          account: true,
          category: true,
        },
      }),
      prisma.transaction.count({ where }),
    ])
    
    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/transactions - Create transaction
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validated = createTransactionSchema.parse(body)
    
    // Check if idempotency key exists
    if (validated.idempotencyKey) {
      const existing = await prisma.transaction.findUnique({
        where: { idempotencyKey: validated.idempotencyKey },
      })
      
      if (existing) {
        return NextResponse.json({ transaction: existing }, { status: 200 })
      }
    }
    
    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: validated.accountId, userId: user.id },
    })
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }
    
    // Handle transfer transactions
    let transferToTransaction = null
    if (validated.type === 'transfer' && validated.transferToAccountId) {
      const toAccount = await prisma.account.findFirst({
        where: { id: validated.transferToAccountId, userId: user.id },
      })
      
      if (!toAccount) {
        return NextResponse.json(
          { error: 'Transfer destination account not found' },
          { status: 404 }
        )
      }
      
      // Verify household if shared
      let householdId = null
      if (validated.isShared && validated.householdId) {
        const member = await prisma.householdMember.findFirst({
          where: {
            userId: user.id,
            householdId: validated.householdId,
          },
        })
        if (member) {
          householdId = validated.householdId
        }
      }

      // Create the transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: validated.accountId,
          categoryId: validated.categoryId,
          type: validated.type,
          amount: validated.amount,
          description: validated.description,
          date: new Date(validated.date),
          notes: validated.notes,
          idempotencyKey: validated.idempotencyKey,
          externalId: validated.externalId,
          isShared: validated.isShared && householdId ? true : false,
          householdId: householdId,
        },
        include: {
          account: true,
          category: true,
        },
      })
      
      // Create the other side of the transfer
      transferToTransaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: validated.transferToAccountId,
          type: 'transfer',
          amount: validated.amount,
          description: `Transfer from ${account.name}`,
          date: new Date(validated.date),
          transferToAccountId: validated.accountId,
          transferToTransactionId: transaction.id,
        },
      })
      
      // Update transaction with link
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { transferToTransactionId: transferToTransaction.id },
      })
      
      // Update account balances
      await prisma.account.update({
        where: { id: validated.accountId },
        data: { balance: { decrement: validated.amount } },
      })
      
      await prisma.account.update({
        where: { id: validated.transferToAccountId },
        data: { balance: { increment: validated.amount } },
      })
      
      return NextResponse.json({ transaction }, { status: 201 })
    }
    
    // Smart category suggestion if no category provided (non-blocking)
    let categoryId = validated.categoryId
    
    // Verify household if shared
    let householdId = null
    if (validated.isShared && validated.householdId) {
      const member = await prisma.householdMember.findFirst({
        where: {
          userId: user.id,
          householdId: validated.householdId,
        },
      })
      if (member) {
        householdId = validated.householdId
      }
    }

    // Create transaction first (don't block on suggestion)
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: validated.accountId,
        categoryId: categoryId || validated.categoryId,
        type: validated.type,
        amount: validated.amount,
        description: validated.description,
        date: new Date(validated.date),
        notes: validated.notes,
        idempotencyKey: validated.idempotencyKey,
        externalId: validated.externalId,
        isShared: validated.isShared && householdId ? true : false,
        householdId: householdId,
      },
      include: {
        account: true,
        category: true,
      },
    })
    
    // Update account balance
    const balanceChange = validated.type === 'income' 
      ? validated.amount 
      : -validated.amount
    
    await prisma.account.update({
      where: { id: validated.accountId },
      data: { balance: { increment: balanceChange } },
    })
    
    // Create audit log (non-blocking)
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'transaction.created',
        entityType: 'Transaction',
        entityId: transaction.id,
        metadata: JSON.stringify({ type: validated.type, amount: validated.amount }),
      },
    }).catch(() => {}) // Silent fail - audit log is not critical
    
    // Smart category suggestion in background (non-blocking)
    if (!categoryId && validated.description && validated.description.length > 3) {
      // Run suggestion in background - don't wait for it
      suggestCategory(
        prisma,
        user.id,
        validated.description,
        validated.amount,
        validated.type
      ).then(suggestions => {
        if (suggestions.length > 0 && suggestions[0].confidence > 0.7) {
          // Auto-assign in background if high confidence
          prisma.transaction.update({
            where: { id: transaction.id },
            data: { categoryId: suggestions[0].categoryId },
          }).catch(() => {}) // Silent fail - not critical
        }
      }).catch(() => {}) // Silent fail - suggestion is optional
    }
    
    // Revalidate cache
    revalidateTag('dashboard')
    revalidateTag('transactions')
    
    // Trigger real-time updates (non-blocking)
    notifyDashboardUpdate(user.clerkUserId, { action: 'transaction_created' }).catch((err) => console.error('Pusher error:', err))
    
    // If shared transaction, notify household members
    if (householdId) {
      notifyHouseholdTransaction(householdId, transaction, user.name || 'Someone').catch(() => {})
    }
    
    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

