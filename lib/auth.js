import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

/**
 * Get or create user in database from Clerk session
 */
export async function getOrCreateUser() {
  try {
    const authResult = await auth()
    const { userId } = authResult || {}
    
    if (!userId) {
      return null
    }
    
    const clerkUser = await currentUser()
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
        },
      })
    }
    
    return user
  } catch (error) {
    console.error('Error in getOrCreateUser:', error)
    return null
  }
}

/**
 * Get current user ID from Clerk
 */
export async function getCurrentUserId() {
  try {
    const authResult = await auth()
    return authResult?.userId || null
  } catch (error) {
    console.error('Error in getCurrentUserId:', error)
    return null
  }
}

