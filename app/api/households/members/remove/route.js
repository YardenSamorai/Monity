import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyHouseholdEvent, EVENTS } from '@/lib/pusher'

// POST /api/households/members/remove - Remove a member from household
export async function POST(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
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

    // Only owners and admins can remove members
    if (!['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can remove members' },
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

    // Cannot remove yourself
    if (targetMember.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself. Use the leave option instead.' },
        { status: 400 }
      )
    }

    // Admins cannot remove owners
    if (currentMember.role === 'admin' && targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Admins cannot remove owners' },
        { status: 403 }
      )
    }

    // Admins cannot remove other admins
    if (currentMember.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot remove other admins' },
        { status: 403 }
      )
    }

    // Remove the member
    await prisma.householdMember.delete({
      where: { id: memberId },
    })

    // Revalidate cache and notify
    revalidateTag('household')
    notifyHouseholdEvent(currentMember.householdId, EVENTS.MEMBER_LEFT, {
      memberName: targetMember.user.name || targetMember.user.email,
      memberId: targetMember.userId,
      removedBy: user.name || user.email,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
