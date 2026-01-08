import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

// Simple in-memory cache for user data (lasts for request duration)
const userCache = new Map()

/**
 * Get or create user in database from Clerk session
 * Uses caching to avoid repeated database lookups
 */
export async function getOrCreateUser() {
  try {
    const authResult = await auth()
    const { userId } = authResult || {}
    
    if (!userId) {
      return null
    }
    
    // Check cache first
    if (userCache.has(userId)) {
      return userCache.get(userId)
    }
    
    // Find user in database (upsert pattern for efficiency)
    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })
    
    if (!user) {
      // Only fetch Clerk user data when creating new user
      const clerkUser = await currentUser()
      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
        },
      })
    }
    
    // Cache the user
    userCache.set(userId, user)
    
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

