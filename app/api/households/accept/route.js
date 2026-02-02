import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/households/accept - Accept household invitation
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Check if user already belongs to a household
    const existingMember = await prisma.householdMember.findFirst({
      where: { userId: user.id },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User already belongs to a household' },
        { status: 400 }
      )
    }

    // Try to find invitation by token
    let invitation = await prisma.householdInvitation.findFirst({
      where: {
        token,
        status: 'pending',
      },
      include: {
        household: {
          include: {
            members: true,
          },
        },
      },
    })

    // If no invitation found, try household inviteToken
    if (!invitation) {
      const household = await prisma.household.findUnique({
        where: { inviteToken: token },
        include: {
          members: true,
        },
      })

      if (!household) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation token' },
          { status: 400 }
        )
      }

      // Check if household is full
      if (household.members.length >= 6) {
        return NextResponse.json(
          { error: 'Household is full (maximum 6 members)' },
          { status: 400 }
        )
      }

      // Check if user is already a member
      const isMember = household.members.some(m => m.userId === user.id)
      if (isMember) {
        return NextResponse.json(
          { error: 'User is already a member of this household' },
          { status: 400 }
        )
      }

      // Add user to household
      await prisma.householdMember.create({
        data: {
          householdId: household.id,
          userId: user.id,
          role: 'member',
        },
      })

      // Get updated household
      const updatedHousehold = await prisma.household.findUnique({
        where: { id: household.id },
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
          ...updatedHousehold,
          role: 'member',
          members: updatedHousehold.members.map(m => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt,
          })),
        },
      })
    }

    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      await prisma.householdInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if household is full
    if (invitation.household.members.length >= 6) {
      return NextResponse.json(
        { error: 'Household is full (maximum 6 members)' },
        { status: 400 }
      )
    }

    // If invitation has email, verify it matches user's email
    if (invitation.email && invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'Invitation email does not match your account email' },
        { status: 400 }
      )
    }

    // Add user to household
    await prisma.householdMember.create({
      data: {
        householdId: invitation.household.id,
        userId: user.id,
        role: 'member',
      },
    })

    // Update invitation status
    await prisma.householdInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    // Get updated household
    const updatedHousehold = await prisma.household.findUnique({
      where: { id: invitation.household.id },
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
        ...updatedHousehold,
        role: 'member',
        members: updatedHousehold.members.map(m => ({
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
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
