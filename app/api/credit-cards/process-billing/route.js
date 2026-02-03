import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/credit-cards/process-billing - Process billing for cards due today
// This should be called by a cron job daily
export async function POST(request) {
  try {
    // Optional: Add API key verification for cron jobs
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('apiKey')
    
    // You can add API key verification here if needed
    // if (apiKey !== process.env.CRON_API_KEY) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const today = new Date()
    const currentDay = today.getDate()

    // Find all cards with billing day = today
    const cardsDueToday = await prisma.creditCard.findMany({
      where: {
        billingDay: currentDay,
        isActive: true,
      },
      include: {
        linkedAccount: true,
        user: {
          select: {
            id: true,
            preferredCurrency: true,
          },
        },
      },
    })

    const results = []

    for (const card of cardsDueToday) {
      try {
        // Get all pending transactions for this card
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

        // Calculate total amount
        const totalAmount = pendingTransactions.reduce(
          (sum, t) => sum + Number(t.amount),
          0
        )

        // Create bank transaction
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

        // Update account balance
        await prisma.account.update({
          where: { id: card.linkedAccountId },
          data: {
            balance: {
              decrement: totalAmount,
            },
          },
        })

        // Mark all card transactions as billed
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

        // Create notification for the user
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

    return NextResponse.json({
      processed: cardsDueToday.length,
      results,
      processedAt: today.toISOString(),
    })
  } catch (error) {
    console.error('Error processing billing:', error)
    return NextResponse.json(
      { error: 'Failed to process billing', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/credit-cards/process-billing - Preview what would be billed today
export async function GET(request) {
  try {
    const today = new Date()
    const currentDay = today.getDate()

    const cardsDueToday = await prisma.creditCard.findMany({
      where: {
        billingDay: currentDay,
        isActive: true,
      },
      include: {
        linkedAccount: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            transactions: {
              where: { status: 'pending' },
            },
          },
        },
      },
    })

    const preview = await Promise.all(
      cardsDueToday.map(async (card) => {
        const pendingSum = await prisma.creditCardTransaction.aggregate({
          where: {
            creditCardId: card.id,
            status: 'pending',
          },
          _sum: { amount: true },
        })

        return {
          cardId: card.id,
          cardName: card.name,
          lastFourDigits: card.lastFourDigits,
          linkedAccount: card.linkedAccount.name,
          pendingAmount: pendingSum._sum.amount || 0,
          pendingCount: card._count.transactions,
        }
      })
    )

    return NextResponse.json({
      billingDay: currentDay,
      cardsCount: cardsDueToday.length,
      preview,
    })
  } catch (error) {
    console.error('Error fetching billing preview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing preview' },
      { status: 500 }
    )
  }
}
