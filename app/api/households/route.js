import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// GET /api/households - Get user's household
export async function GET(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find household where user is a member
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
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ household: null })
    }

    // Get pending invitations
    const invitations = await prisma.householdInvitation.findMany({
      where: {
        householdId: member.household.id,
        status: 'pending',
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate total household income
    const totalHouseholdIncome = member.household.members.reduce((sum, m) => {
      return sum + (m.monthlySalary ? Number(m.monthlySalary) : 0)
    }, 0)

    return NextResponse.json({
      household: {
        ...member.household,
        role: member.role,
        totalHouseholdIncome,
        members: member.household.members.map(m => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
          monthlySalary: m.monthlySalary ? Number(m.monthlySalary) : null,
          salaryDay: m.salaryDay,
          isCurrentUser: m.userId === user.id,
        })),
        invitations,
      },
    })
  } catch (error) {
    console.error('Error fetching household:', error)
    return NextResponse.json(
      { error: 'Failed to fetch household' },
      { status: 500 }
    )
  }
}

// POST /api/households - Create household
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a household
    const existingMember = await prisma.householdMember.findFirst({
      where: { userId: user.id },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User already belongs to a household' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.message },
        { status: 400 }
      )
    }

    const name = body?.name || `${user.name || 'Family'}'s Household`

    // Generate unique invite token
    const inviteToken = randomBytes(32).toString('hex')

    // Create household and add creator as owner
    const household = await prisma.household.create({
      data: {
        name,
        inviteToken,
        createdByUserId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      household: {
        ...household,
        role: 'owner',
        members: household.members.map(m => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error creating household:', error)
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to create household',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
