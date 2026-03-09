import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCardDisplayName, getOrCreateCreditCategory } from '@/lib/auto-process'

// GET /api/migrate-cc-transactions
// One-time migration: fix existing credit card billing transactions
// - Translates English descriptions to Hebrew
// - Assigns "חיובי אשראי" category
export async function GET() {
  try {
    const oldTransactions = await prisma.transaction.findMany({
      where: {
        description: { startsWith: 'Credit card charge' },
      },
    })

    if (oldTransactions.length === 0) {
      return NextResponse.json({ message: 'No transactions to migrate', count: 0 })
    }

    const creditCategoryCache = {}
    let updated = 0

    for (const tx of oldTransactions) {
      try {
        if (!creditCategoryCache[tx.userId]) {
          creditCategoryCache[tx.userId] = await getOrCreateCreditCategory(tx.userId)
        }
        const category = creditCategoryCache[tx.userId]

        // Extract card type and last 4 digits from description
        // Format: "Credit card charge – mastercard ••••1228"
        const match = tx.description.match(/Credit card charge\s*[–-]\s*(\w+)\s*[•·]+(\d+)/)
        let newDescription = tx.description

        if (match) {
          const cardType = match[1]
          const lastFour = match[2]
          const displayName = getCardDisplayName(cardType)
          newDescription = `חיוב ${displayName} ••••${lastFour}`
        }

        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            description: newDescription,
            categoryId: category?.id || tx.categoryId,
            notes: tx.notes?.startsWith('Automatic charge')
              ? tx.notes.replace(/Automatic charge for (\d+) credit card transactions/, 'חיוב אוטומטי עבור $1 עסקאות אשראי')
              : tx.notes,
          },
        })

        updated++
      } catch (err) {
        console.error(`Failed to migrate transaction ${tx.id}:`, err)
      }
    }

    return NextResponse.json({
      message: `Migrated ${updated} of ${oldTransactions.length} transactions`,
      found: oldTransactions.length,
      updated,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}
