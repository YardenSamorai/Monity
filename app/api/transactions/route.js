import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTransactionSchema } from '@/lib/validations'

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
    
    const where = { userId: user.id }
    
    if (type) where.type = type
    if (accountId) where.accountId = accountId
    if (categoryId) where.categoryId = categoryId
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
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
    
    // Create regular transaction
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
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'transaction.created',
        entityType: 'Transaction',
        entityId: transaction.id,
        metadata: JSON.stringify({ type: validated.type, amount: validated.amount }),
      },
    })
    
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

