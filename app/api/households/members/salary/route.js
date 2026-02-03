import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/households/members/salary - Update own salary
export async function PUT(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { monthlySalary, salaryDay } = body

    // Find user's household membership
    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: { household: true },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'User is not a member of any household' },
        { status: 400 }
      )
    }

    // Update salary information
    const updatedMember = await prisma.householdMember.update({
      where: { id: member.id },
      data: {
        monthlySalary: monthlySalary ? parseFloat(monthlySalary) : null,
        salaryDay: salaryDay ? parseInt(salaryDay) : null,
        salaryUpdatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        userId: updatedMember.user.id,
        name: updatedMember.user.name,
        email: updatedMember.user.email,
        role: updatedMember.role,
        monthlySalary: updatedMember.monthlySalary,
        salaryDay: updatedMember.salaryDay,
        salaryUpdatedAt: updatedMember.salaryUpdatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating salary:', error)
    return NextResponse.json(
      { error: 'Failed to update salary' },
      { status: 500 }
    )
  }
}

// GET /api/households/members/salary - Get all members' salaries
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user's household
    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'User is not a member of any household' },
        { status: 400 }
      )
    }

    // Calculate total household income
    const members = member.household.members.map(m => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      monthlySalary: m.monthlySalary ? Number(m.monthlySalary) : null,
      salaryDay: m.salaryDay,
      salaryUpdatedAt: m.salaryUpdatedAt,
      isCurrentUser: m.userId === user.id,
    }))

    const totalHouseholdIncome = members.reduce((sum, m) => {
      return sum + (m.monthlySalary || 0)
    }, 0)

    return NextResponse.json({
      members,
      totalHouseholdIncome,
      householdName: member.household.name,
    })
  } catch (error) {
    console.error('Error fetching salaries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salaries' },
      { status: 500 }
    )
  }
}
