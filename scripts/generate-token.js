require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

async function main() {
  const prisma = new PrismaClient()
  const mode = process.argv[2]
  
  try {
    if (mode === 'new') {
      const clerkId = `test_${crypto.randomBytes(8).toString('hex')}`
      const user = await prisma.user.create({
        data: {
          clerkUserId: clerkId,
          email: `test-${Date.now()}@monity.test`,
          name: null,
          hasCompletedOnboarding: false,
          preferredCurrency: 'USD',
          preferredLanguage: 'en',
        },
      })
      
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.apiToken.create({
        data: { userId: user.id, token, name: 'Monity iOS Test', isActive: true },
      })
      
      console.log('\n=== NEW USER + TOKEN ===')
      console.log(`User ID: ${user.id}`)
      console.log(`Email: ${user.email}`)
      console.log(`Onboarding: NOT completed`)
      console.log(`Token: ${token}`)
      console.log('Server URL: http://localhost:4000')
      console.log('========================\n')
    } else {
      const users = await prisma.user.findMany({ take: 1 })
      if (users.length === 0) {
        console.error('No users found. Use "node scripts/generate-token.js new" to create one.')
        process.exit(1)
      }
      
      const user = users[0]
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.apiToken.create({
        data: { userId: user.id, token, name: 'Monity iOS App', isActive: true },
      })
      
      console.log('\n=== API Token Generated ===')
      console.log(`User: ${user.email || user.name || user.id}`)
      console.log(`Onboarding: ${user.hasCompletedOnboarding ? 'completed' : 'NOT completed'}`)
      console.log(`Token: ${token}`)
      console.log('Server URL: http://localhost:4000')
      console.log('===========================\n')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
