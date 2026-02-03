import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShell from '@/components/AppShell'
import { TransactionsClient } from './TransactionsClient'
import { serializePrismaData } from '@/lib/utils'

// Force dynamic rendering - no caching for instant updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Card type names for display
const CARD_TYPE_NAMES = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
  isracard: 'Isracard',
  cal: 'Cal',
  max: 'Max',
  other: 'Card',
}

export default async function TransactionsPage() {
  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  const [transactions, creditCardTransactions, accounts, categories, creditCards] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      take: 100,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        notes: true,
        isShared: true,
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
        savingsGoal: { select: { id: true, name: true } },
        tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
      },
    }),
    // Also fetch credit card transactions
    prisma.creditCardTransaction.findMany({
      where: { userId: user.id },
      take: 100,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        amount: true,
        description: true,
        date: true,
        status: true,
        creditCard: { select: { id: true, name: true, lastFourDigits: true } },
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    }),
    prisma.account.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, balance: true, currency: true },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, color: true, icon: true },
    }),
    prisma.creditCard.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, lastFourDigits: true },
    }),
  ])

  // Transform credit card transactions to match regular transaction format
  const transformedCCTransactions = creditCardTransactions.map(ccTx => ({
    id: ccTx.id,
    type: 'expense', // Credit card transactions are always expenses
    amount: ccTx.amount,
    description: ccTx.description,
    date: ccTx.date,
    notes: null,
    isShared: false,
    isCreditCard: true, // Flag to identify credit card transactions
    creditCardStatus: ccTx.status, // 'pending' or 'billed'
    account: {
      id: ccTx.creditCard.id,
      name: `${CARD_TYPE_NAMES[ccTx.creditCard.name] || ccTx.creditCard.name} •••• ${ccTx.creditCard.lastFourDigits}`,
      type: 'credit',
    },
    category: ccTx.category,
    savingsGoal: null,
    tags: [],
  }))

  // Merge and sort all transactions by date
  const allTransactions = [...transactions, ...transformedCCTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 100)

  return (
    <AppShell>
      <TransactionsClient
        initialTransactions={serializePrismaData(allTransactions)}
        accounts={serializePrismaData(accounts)}
        categories={serializePrismaData(categories)}
        creditCards={serializePrismaData(creditCards)}
      />
    </AppShell>
  )
}
