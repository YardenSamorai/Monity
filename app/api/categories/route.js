import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCategorySchema } from '@/lib/validations'
import { notifyCategoryChange } from '@/lib/pusher'

// GET /api/categories - List categories
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const where = { userId: user.id }
    
    if (type) {
      where.type = type
    }
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      include: {
        children: true,
      },
    })
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create category
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validated = createCategorySchema.parse(body)
    
    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name: validated.name,
        type: validated.type,
        color: validated.color,
        icon: validated.icon,
        parentId: validated.parentId,
      },
    })
    
    // Revalidate cache and notify
    revalidateTag('categories')
    notifyCategoryChange(user.clerkUserId, 'created', category).catch((err) => console.error('Pusher error:', err))
    
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

