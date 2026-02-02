import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/currency/rates - Get exchange rates for user
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rates = await prisma.currencyRate.findMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ rates })
  } catch (error) {
    console.error('Error fetching currency rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currency rates' },
      { status: 500 }
    )
  }
}

// POST /api/currency/rates - Create or update exchange rate
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromCurrency, toCurrency, rate } = body

    if (!fromCurrency || !toCurrency || !rate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const currencyRate = await prisma.currencyRate.upsert({
      where: {
        userId_fromCurrency_toCurrency: {
          userId: user.id,
          fromCurrency,
          toCurrency,
        },
      },
      update: {
        rate: Number(rate),
        lastUpdated: new Date(),
      },
      create: {
        userId: user.id,
        fromCurrency,
        toCurrency,
        rate: Number(rate),
        source: 'manual',
      },
    })

    return NextResponse.json({ rate: currencyRate })
  } catch (error) {
    console.error('Error saving currency rate:', error)
    return NextResponse.json(
      { error: 'Failed to save currency rate' },
      { status: 500 }
    )
  }
}

