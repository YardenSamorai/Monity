import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyHouseholdEvent, EVENTS } from '@/lib/pusher'

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

    console.log('[Accept] User:', user.id, user.email)
    
    // Check if user already belongs to a household
    const existingMember = await prisma.householdMember.findFirst({
      where: { userId: user.id },
    })

    if (existingMember) {
      console.log('[Accept] ERROR: User already in household')
      return NextResponse.json(
        { error: 'User already belongs to a household', code: 'ALREADY_MEMBER' },
        { status: 400 }
      )
    }

    console.log('[Accept] Looking for invitation with token:', token.substring(0, 10) + '...')
    
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

    console.log('[Accept] Invitation found:', invitation ? 'yes' : 'no')

    // If no invitation found, try household inviteToken
    if (!invitation) {
      console.log('[Accept] Trying household inviteToken...')
      const household = await prisma.household.findUnique({
        where: { inviteToken: token },
        include: {
          members: true,
        },
      })

      console.log('[Accept] Household by inviteToken:', household ? 'yes' : 'no')

      if (!household) {
        console.log('[Accept] ERROR: No invitation or household found for token')
        return NextResponse.json(
          { error: 'Invalid or expired invitation token', code: 'TOKEN_NOT_FOUND' },
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

      // Notify household members about the new member
      revalidateTag('household')
      notifyHouseholdEvent(household.id, EVENTS.MEMBER_JOINED, {
        memberName: user.name || user.email,
        memberId: user.id,
      }).catch(() => {})

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
      console.log('[Accept] ERROR: Invitation expired')
      await prisma.householdInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      })
      return NextResponse.json(
        { error: 'Invitation has expired', code: 'EXPIRED' },
        { status: 400 }
      )
    }

    // Check if household is full
    if (invitation.household.members.length >= 6) {
      console.log('[Accept] ERROR: Household full')
      return NextResponse.json(
        { error: 'Household is full (maximum 6 members)', code: 'FULL' },
        { status: 400 }
      )
    }

    // Log email check but don't block - allow any logged-in user to accept
    if (invitation.email && invitation.email !== user.email) {
      console.log('[Accept] WARNING: Email mismatch. Invitation:', invitation.email, 'User:', user.email, '- allowing anyway')
      // Don't block - user might have multiple email addresses or forwarded the invite
    }
    
    console.log('[Accept] All checks passed, adding user to household')

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

    // Notify household members about the new member
    revalidateTag('household')
    notifyHouseholdEvent(invitation.household.id, EVENTS.MEMBER_JOINED, {
      memberName: user.name || user.email,
      memberId: user.id,
    }).catch(() => {})
    notifyHouseholdEvent(invitation.household.id, EVENTS.INVITE_ACCEPTED, {
      memberName: user.name || user.email,
      memberId: user.id,
    }).catch(() => {})

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
