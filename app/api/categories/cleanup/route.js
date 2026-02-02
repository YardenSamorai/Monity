import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 1: Delete ALL global categories (isDefault=true but no userId)
    // These are the problematic ones that show for everyone
    const deletedGlobal = await prisma.category.deleteMany({
      where: { 
        userId: null,
        isDefault: true 
      }
    })

    // Step 2: Find all categories for this user and remove duplicates
    const allCategories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }, // Keep the oldest one
    })

    // Group by name to find duplicates
    const categoryMap = new Map()
    const duplicateIds = []

    for (const category of allCategories) {
      if (categoryMap.has(category.name)) {
        // This is a duplicate - mark for deletion
        duplicateIds.push(category.id)
      } else {
        // First occurrence - keep it
        categoryMap.set(category.name, category.id)
      }
    }

    let removedUserDuplicates = 0
    if (duplicateIds.length > 0) {
      await prisma.category.deleteMany({
        where: { id: { in: duplicateIds } }
      })
      removedUserDuplicates = duplicateIds.length
    }

    return NextResponse.json({ 
      message: 'Cleanup completed',
      removedGlobalCategories: deletedGlobal.count,
      removedUserDuplicates: removedUserDuplicates,
      remaining: allCategories.length - removedUserDuplicates
    })
  } catch (error) {
    console.error('Error cleaning up categories:', error)
    return NextResponse.json({ error: 'Failed to cleanup categories' }, { status: 500 })
  }
}
