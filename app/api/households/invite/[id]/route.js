import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/households/invite/[id] - Cancel/revoke an invitation
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the invitation
    const invitation = await prisma.householdInvitation.findUnique({
      where: { id },
      include: {
        household: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if user is a member of the household (and has permission)
    const member = invitation.household.members.find(m => m.userId === user.id)
    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this household' },
        { status: 403 }
      )
    }

    // Only owner/admin or the person who sent the invite can cancel it
    const canCancel = 
      member.role === 'owner' || 
      member.role === 'admin' || 
      invitation.invitedByUserId === user.id

    if (!canCancel) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this invitation' },
        { status: 403 }
      )
    }

    // Delete the invitation (or update status to 'cancelled')
    await prisma.householdInvitation.delete({
      where: { id },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Invitation cancelled successfully' 
    })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}

// GET /api/households/invite/[id] - Get invitation details (for accept page)
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const invitation = await prisma.householdInvitation.findFirst({
      where: {
        OR: [
          { id },
          { token: id }, // Also allow lookup by token
        ],
        status: 'pending',
      },
      include: {
        household: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 })
    }

    // Check if expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        householdName: invitation.household.name,
        invitedBy: invitation.invitedBy?.name || invitation.invitedBy?.email,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}
