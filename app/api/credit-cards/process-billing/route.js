import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function verifyCron(request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

async function processCreditCardBilling() {
  const today = new Date()
  const currentDay = today.getDate()

  const cardsDueToday = await prisma.creditCard.findMany({
    where: {
      billingDay: currentDay,
      isActive: true,
    },
    include: {
      linkedAccount: true,
      user: { select: { id: true, preferredCurrency: true } },
    },
  })

  const results = []

  for (const card of cardsDueToday) {
    try {
      const pendingTransactions = await prisma.creditCardTransaction.findMany({
        where: {
          creditCardId: card.id,
          status: 'pending',
        },
      })

      if (pendingTransactions.length === 0) {
        results.push({
          cardId: card.id,
          cardName: card.name,
          status: 'skipped',
          reason: 'No pending transactions',
        })
        continue
      }

      const totalAmount = pendingTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      )

      const bankTransaction = await prisma.transaction.create({
        data: {
          userId: card.userId,
          accountId: card.linkedAccountId,
          type: 'expense',
          amount: totalAmount,
          description: `Credit card charge – ${card.name} ••••${card.lastFourDigits}`,
          date: today,
          notes: `Automatic charge for ${pendingTransactions.length} credit card transactions`,
        },
      })

      await prisma.account.update({
        where: { id: card.linkedAccountId },
        data: { balance: { decrement: totalAmount } },
      })

      await prisma.creditCardTransaction.updateMany({
        where: {
          creditCardId: card.id,
          status: 'pending',
        },
        data: {
          status: 'billed',
          billedDate: today,
          bankTransactionId: bankTransaction.id,
        },
      })

      await prisma.notification.create({
        data: {
          userId: card.userId,
          type: 'credit_card_billed',
          title: 'Credit Card Charged',
          message: `Your ${card.name} card was charged ${totalAmount.toFixed(2)} for ${pendingTransactions.length} transactions.`,
          metadata: JSON.stringify({
            cardId: card.id,
            cardName: card.name,
            amount: totalAmount,
            transactionCount: pendingTransactions.length,
            bankTransactionId: bankTransaction.id,
          }),
        },
      })

      results.push({
        cardId: card.id,
        cardName: card.name,
        status: 'success',
        amount: totalAmount,
        transactionCount: pendingTransactions.length,
        bankTransactionId: bankTransaction.id,
      })
    } catch (cardError) {
      console.error(`Error processing card ${card.id}:`, cardError)
      results.push({
        cardId: card.id,
        cardName: card.name,
        status: 'error',
        error: cardError.message,
      })
    }
  }

  return {
    processed: cardsDueToday.length,
    results,
    processedAt: today.toISOString(),
  }
}

// GET /api/credit-cards/process-billing - Called by Vercel cron
export async function GET(request) {
  try {
    if (!verifyCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await processCreditCardBilling()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing billing:', error)
    return NextResponse.json(
      { error: 'Failed to process billing', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/credit-cards/process-billing - Manual trigger
export async function POST(request) {
  try {
    if (!verifyCron(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await processCreditCardBilling()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing billing:', error)
    return NextResponse.json(
      { error: 'Failed to process billing', details: error.message },
      { status: 500 }
    )
  }
}
