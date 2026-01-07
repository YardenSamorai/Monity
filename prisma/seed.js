const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // Create default categories
  const defaultCategories = [
    // Income categories
    { name: 'Salary', type: 'income', color: '#10B981', isDefault: true },
    { name: 'Freelance', type: 'income', color: '#10B981', isDefault: true },
    { name: 'Investment', type: 'income', color: '#10B981', isDefault: true },
    { name: 'Other Income', type: 'income', color: '#10B981', isDefault: true },
    
    // Expense categories
    { name: 'Food & Dining', type: 'expense', color: '#EF4444', isDefault: true },
    { name: 'Shopping', type: 'expense', color: '#F59E0B', isDefault: true },
    { name: 'Transportation', type: 'expense', color: '#3B82F6', isDefault: true },
    { name: 'Bills & Utilities', type: 'expense', color: '#8B5CF6', isDefault: true },
    { name: 'Entertainment', type: 'expense', color: '#EC4899', isDefault: true },
    { name: 'Healthcare', type: 'expense', color: '#14B8A6', isDefault: true },
    { name: 'Education', type: 'expense', color: '#6366F1', isDefault: true },
    { name: 'Travel', type: 'expense', color: '#06B6D4', isDefault: true },
    { name: 'Other Expense', type: 'expense', color: '#6B7280', isDefault: true },
  ]
  
  for (const category of defaultCategories) {
    // Check if category already exists
    const existing = await prisma.category.findFirst({
      where: {
        name: category.name,
        isDefault: true,
      },
    })
    
    if (!existing) {
      await prisma.category.create({
        data: category,
      })
    }
  }
  
  console.log('✅ Seeded default categories')
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

