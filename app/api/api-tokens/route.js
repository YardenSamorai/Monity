import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiToken } from '@/lib/utils'

// GET /api/api-tokens - List API tokens
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tokens = await prisma.apiToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        token: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    })
    
    // Mask tokens for security (show only first 8 chars)
    const maskedTokens = tokens.map(token => ({
      ...token,
      token: token.token.substring(0, 8) + '...',
    }))
    
    return NextResponse.json({ tokens: maskedTokens })
  } catch (error) {
    console.error('Error fetching API tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API tokens' },
      { status: 500 }
    )
  }
}

// POST /api/api-tokens - Create API token
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const name = body.name || 'iPhone Shortcut'
    const expiresInDays = body.expiresInDays ? parseInt(body.expiresInDays) : null
    
    const token = generateApiToken()
    
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null
    
    const apiToken = await prisma.apiToken.create({
      data: {
        userId: user.id,
        token,
        name,
        expiresAt,
      },
    })
    
    // Return full token only on creation
    return NextResponse.json({
      token: {
        id: apiToken.id,
        name: apiToken.name,
        token: apiToken.token, // Full token shown only once
        expiresAt: apiToken.expiresAt,
        createdAt: apiToken.createdAt,
      },
      message: 'Save this token securely. It will not be shown again.',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating API token:', error)
    return NextResponse.json(
      { error: 'Failed to create API token' },
      { status: 500 }
    )
  }
}

