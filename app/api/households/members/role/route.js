import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyHouseholdEvent, EVENTS } from '@/lib/pusher'

// PUT /api/households/members/role - Update member role
export async function PUT(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { memberId, role } = body

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'memberId and role are required' },
        { status: 400 }
      )
    }

    const validRoles = ['owner', 'admin', 'member', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Find current user's household membership
    const currentMember = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: { household: true },
    })

    if (!currentMember) {
      return NextResponse.json(
        { error: 'User is not a member of any household' },
        { status: 400 }
      )
    }

    // Only owners and admins can change roles
    if (!['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can change member roles' },
        { status: 403 }
      )
    }

    // Find the target member
    const targetMember = await prisma.householdMember.findFirst({
      where: {
        id: memberId,
        householdId: currentMember.householdId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found in your household' },
        { status: 404 }
      )
    }

    // Admins cannot change owner roles or promote to owner
    if (currentMember.role === 'admin') {
      if (targetMember.role === 'owner') {
        return NextResponse.json(
          { error: 'Admins cannot change the owner\'s role' },
          { status: 403 }
        )
      }
      if (role === 'owner') {
        return NextResponse.json(
          { error: 'Admins cannot promote members to owner' },
          { status: 403 }
        )
      }
    }

    // Cannot demote yourself if you're the only owner
    if (targetMember.userId === user.id && targetMember.role === 'owner' && role !== 'owner') {
      const ownerCount = await prisma.householdMember.count({
        where: {
          householdId: currentMember.householdId,
          role: 'owner',
        },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot change your role. You are the only owner. Promote another member first.' },
          { status: 400 }
        )
      }
    }

    // Update the role
    const updatedMember = await prisma.householdMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Revalidate cache and notify
    revalidateTag('household')
    notifyHouseholdEvent(currentMember.householdId, EVENTS.MEMBER_UPDATED, {
      memberName: updatedMember.user.name || updatedMember.user.email,
      memberId: updatedMember.userId,
      newRole: role,
    }).catch(() => {})

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        userId: updatedMember.user.id,
        name: updatedMember.user.name,
        email: updatedMember.user.email,
        role: updatedMember.role,
      },
    })
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    )
  }
}
