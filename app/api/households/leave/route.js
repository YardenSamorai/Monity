import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyHouseholdEvent, EVENTS } from '@/lib/pusher'

// DELETE /api/households/leave - Leave household
export async function DELETE(request) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user's household membership
    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: {
        household: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'User does not belong to a household' },
        { status: 400 }
      )
    }

    // If user is the owner and there are other members, transfer ownership
    if (member.role === 'owner' && member.household.members.length > 1) {
      // Find another member to transfer ownership to
      const newOwner = member.household.members.find(m => m.userId !== user.id)
      if (newOwner) {
        await prisma.householdMember.update({
          where: { id: newOwner.id },
          data: { role: 'owner' },
        })
      }
    }

    // If user is the only member, delete the household
    if (member.household.members.length === 1) {
      await prisma.household.delete({
        where: { id: member.household.id },
      })
    } else {
      // Remove user from household
      await prisma.householdMember.delete({
        where: { id: member.id },
      })
      
      // Notify remaining household members
      notifyHouseholdEvent(member.household.id, EVENTS.MEMBER_LEFT, {
        memberName: user.name || user.email,
        memberId: user.id,
      }).catch(() => {})
    }

    // Revalidate cache
    revalidateTag('household')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving household:', error)
    return NextResponse.json(
      { error: 'Failed to leave household' },
      { status: 500 }
    )
  }
}
