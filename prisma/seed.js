const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // NOTE: Default categories are now created per-user when they register
  // See lib/auth.js - createDefaultCategories()
  // 
  // We no longer create global categories without userId,
  // as they cause duplicate issues when queried with OR conditions.
  
  // Clean up any existing global categories (without userId)
  const deleted = await prisma.category.deleteMany({
    where: {
      userId: null,
      isDefault: true,
    },
  })
  
  if (deleted.count > 0) {
    console.log(`🧹 Cleaned up ${deleted.count} global categories`)
  }
  
  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

