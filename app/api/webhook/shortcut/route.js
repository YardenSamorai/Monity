import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shortcutWebhookSchema } from '@/lib/validations'

/**
 * POST /api/webhook/shortcut
 * 
 * Webhook endpoint for iPhone Shortcuts integration
 * 
 * Authentication: Bearer token (API token from ApiToken table)
 * 
 * Request body:
 * {
 *   "type": "income" | "expense",
 *   "amount": 25.50,
 *   "description": "Coffee at Starbucks",
 *   "category": "Food & Dining", // optional
 *   "account": "Checking", // optional, defaults to first active account
 *   "date": "2024-01-15T10:30:00Z", // optional, defaults to now
 *   "idempotencyKey": "unique-key-from-shortcut"
 * }
 */
export async function POST(request) {
  try {
    // Get API token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Find API token
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { user: true },
    })
    
    if (!apiToken || !apiToken.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive API token' },
        { status: 401 }
      )
    }
    
    // Check expiration
    if (apiToken.expiresAt && new Date(apiToken.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'API token has expired' },
        { status: 401 }
      )
    }
    
    const user = apiToken.user
    
    // Parse and validate request body
    const body = await request.json()
    const validated = shortcutWebhookSchema.parse(body)
    
    // Check idempotency
    if (validated.idempotencyKey) {
      const existing = await prisma.transaction.findUnique({
        where: { idempotencyKey: validated.idempotencyKey },
      })
      
      if (existing) {
        // Return existing transaction (idempotent)
        return NextResponse.json({
          success: true,
          transaction: existing,
          message: 'Transaction already exists (idempotent)',
        })
      }
    }
    
    // Find or get default account
    let account
    if (validated.account) {
      account = await prisma.account.findFirst({
        where: {
          userId: user.id,
          name: { contains: validated.account, mode: 'insensitive' },
          isActive: true,
        },
      })
    }
    
    if (!account) {
      // Get first active account as default
      account = await prisma.account.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: 'asc' },
      })
    }
    
    if (!account) {
      return NextResponse.json(
        { error: 'No active account found. Please create an account first.' },
        { status: 400 }
      )
    }
    
    // Find category if provided
    let category = null
    if (validated.category) {
      category = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: { contains: validated.category, mode: 'insensitive' },
          type: { in: [validated.type, 'both'] },
        },
      })
    }
    
    // Create import record
    const importRecord = await prisma.import.create({
      data: {
        userId: user.id,
        source: 'shortcut',
        status: 'processing',
        metadata: JSON.stringify({
          shortcutVersion: body.version || 'unknown',
          deviceInfo: body.deviceInfo || null,
        }),
      },
    })
    
    // Create transaction
    const transactionDate = validated.date ? new Date(validated.date) : new Date()
    
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: account.id,
        categoryId: category?.id || null,
        type: validated.type,
        amount: validated.amount,
        description: validated.description,
        date: transactionDate,
        idempotencyKey: validated.idempotencyKey,
        externalId: `shortcut_${validated.idempotencyKey}`,
        importId: importRecord.id,
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
      where: { id: account.id },
      data: { balance: { increment: balanceChange } },
    })
    
    // Update import record
    await prisma.import.update({
      where: { id: importRecord.id },
      data: {
        status: 'completed',
        recordsCount: 1,
        successCount: 1,
        completedAt: new Date(),
      },
    })
    
    // Update API token last used
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'transaction.created',
        entityType: 'Transaction',
        entityId: transaction.id,
        metadata: JSON.stringify({ source: 'shortcut', importId: importRecord.id }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })
    
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description,
        date: transaction.date,
      },
      message: 'Transaction created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error processing shortcut webhook:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process webhook request' },
      { status: 500 }
    )
  }
}

