import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/accounts/recalculate-balances - Recalculate all account balances from transactions
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user accounts
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    })

    const results = []

    for (const account of accounts) {
      // Get all transactions for this account (including transfers)
      const transactions = await prisma.transaction.findMany({
        where: {
          accountId: account.id,
          userId: user.id,
        },
        include: {
          account: true,
        },
      })

      // Calculate balance from transactions
      // Start with initial balance (0 or account's initial balance if we track it)
      let calculatedBalance = 0
      
      // Process all transactions in chronological order
      const sortedTransactions = transactions.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      )
      
      for (const transaction of sortedTransactions) {
        if (transaction.type === 'income') {
          calculatedBalance += Number(transaction.amount)
        } else if (transaction.type === 'expense') {
          calculatedBalance -= Number(transaction.amount)
        } else if (transaction.type === 'transfer') {
          // For transfers: 
          // - If this account is the source (accountId matches), subtract
          // - If this account is the destination (transferToAccountId matches), add
          // But we need to avoid double counting
          
          if (transaction.accountId === account.id && transaction.transferToAccountId) {
            // This is a source transfer - subtract from this account
            calculatedBalance -= Number(transaction.amount)
          }
        }
      }

      // Also check for transfer transactions where this account is the destination
      // These are the "incoming" side of transfers
      const incomingTransfers = await prisma.transaction.findMany({
        where: {
          accountId: { not: account.id }, // Not from this account
          transferToAccountId: account.id, // But going to this account
          userId: user.id,
          type: 'transfer',
        },
      })

      for (const transfer of incomingTransfers) {
        // This is an incoming transfer - add to this account
        calculatedBalance += Number(transfer.amount)
      }

      // Update account balance
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: calculatedBalance },
      })

      results.push({
        accountId: account.id,
        accountName: account.name,
        oldBalance: Number(account.balance),
        newBalance: calculatedBalance,
        difference: calculatedBalance - Number(account.balance),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account balances recalculated',
      results,
    })
  } catch (error) {
    console.error('Error recalculating balances:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate balances' },
      { status: 500 }
    )
  }
}

