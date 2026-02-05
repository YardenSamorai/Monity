import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyDashboardUpdate } from '@/lib/pusher'

// PATCH /api/households/[id] - Update household
export async function PATCH(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is owner of this household
    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: id,
        role: 'owner',
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Only the owner can update household settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, icon } = body

    // Update household
    const household = await prisma.household.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
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
      },
    })

    // Notify all members
    for (const m of household.members) {
      const memberUser = await prisma.user.findUnique({
        where: { id: m.userId },
        select: { clerkUserId: true },
      })
      if (memberUser?.clerkUserId) {
        notifyDashboardUpdate(memberUser.clerkUserId, { 
          action: 'household_updated',
          householdId: id,
        }).catch((err) => console.error('Pusher error:', err))
      }
    }

    revalidateTag('household')

    return NextResponse.json({ household })
  } catch (error) {
    console.error('Error updating household:', error)
    return NextResponse.json(
      { error: 'Failed to update household', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/households/[id] - Delete household
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is owner of this household
    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: id,
        role: 'owner',
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Only the owner can delete the household' },
        { status: 403 }
      )
    }

    // Get all members before deletion for notification
    const household = await prisma.household.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { clerkUserId: true },
            },
          },
        },
      },
    })

    // Delete household (cascades to members, invitations, etc.)
    await prisma.household.delete({
      where: { id },
    })

    // Notify all members
    if (household) {
      for (const m of household.members) {
        if (m.user?.clerkUserId) {
          notifyDashboardUpdate(m.user.clerkUserId, { 
            action: 'household_deleted',
            householdId: id,
          }).catch((err) => console.error('Pusher error:', err))
        }
      }
    }

    revalidateTag('household')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting household:', error)
    return NextResponse.json(
      { error: 'Failed to delete household', details: error.message },
      { status: 500 }
    )
  }
}
