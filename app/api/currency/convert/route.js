import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { convertCurrency } from '@/lib/currency'

// POST /api/currency/convert - Convert amount between currencies
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, fromCurrency, toCurrency } = body

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json({ convertedAmount: Number(amount) })
    }

    // Get exchange rate
    const rate = await prisma.currencyRate.findUnique({
      where: {
        userId_fromCurrency_toCurrency: {
          userId: user.id,
          fromCurrency,
          toCurrency,
        },
      },
    })

    if (!rate) {
      return NextResponse.json(
        { error: 'Exchange rate not found. Please set it first.' },
        { status: 404 }
      )
    }

    const convertedAmount = convertCurrency(
      amount,
      fromCurrency,
      toCurrency,
      rate.rate
    )

    return NextResponse.json({ convertedAmount })
  } catch (error) {
    console.error('Error converting currency:', error)
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    )
  }
}

