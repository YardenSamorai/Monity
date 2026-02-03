import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendFamilyInvitationEmail, isEmailConfigured } from '@/lib/email'
import { notifyHouseholdEvent, EVENTS } from '@/lib/pusher'

// POST /api/households/invite - Invite user to household
export async function POST(request) {
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
            members: true,
          },
        },
      },
    })

    if (!member) {
      console.log('[Invite] User does not belong to a household:', user.id)
      return NextResponse.json(
        { error: 'User does not belong to a household', code: 'NO_HOUSEHOLD' },
        { status: 400 }
      )
    }

    // Check if household is full (max 6 members)
    if (member.household.members.length >= 6) {
      console.log('[Invite] Household full:', member.household.id)
      return NextResponse.json(
        { error: 'Household is full (maximum 6 members)', code: 'HOUSEHOLD_FULL' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, inviteLink, locale } = body
    console.log('[Invite] Request body:', { email: email ? '***' : undefined, inviteLink, locale })

    if (!email && !inviteLink) {
      console.log('[Invite] Missing email or inviteLink')
      return NextResponse.json(
        { error: 'Email or inviteLink is required', code: 'MISSING_DATA' },
        { status: 400 }
      )
    }

    // Generate unique token for invitation
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    if (email) {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findFirst({
        where: { email },
      })

      // Check if user is already a member
      if (existingUser) {
        const existingMember = await prisma.householdMember.findFirst({
          where: {
            householdId: member.household.id,
            userId: existingUser.id,
          },
        })

        if (existingMember) {
          return NextResponse.json(
            { error: 'User is already a member of this household' },
            { status: 400 }
          )
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await prisma.householdInvitation.findFirst({
        where: {
          householdId: member.household.id,
          email,
          status: 'pending',
        },
      })

      if (existingInvitation) {
        return NextResponse.json(
          { error: 'Invitation already sent to this email' },
          { status: 400 }
        )
      }

      // Create invitation
      const invitation = await prisma.householdInvitation.create({
        data: {
          householdId: member.household.id,
          invitedByUserId: user.id,
          email,
          token,
          expiresAt,
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
      })

      // Use NEXT_PUBLIC_APP_URL or VERCEL_URL or fallback
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000')
      const inviteLinkUrl = `${baseUrl}/family/accept?token=${token}`
      console.log('[Invite] Generated invite link:', inviteLinkUrl)

      // Send email if configured
      let emailSent = false
      let emailError = null
      
      if (isEmailConfigured()) {
        try {
          await sendFamilyInvitationEmail({
            to: email,
            inviterName: user.name || user.email || 'Someone',
            householdName: member.household.name,
            inviteLink: inviteLinkUrl,
            locale: locale || 'en',
          })
          emailSent = true
        } catch (err) {
          console.error('Failed to send invitation email:', err)
          emailError = err.message
        }
      } else {
        console.log('Email not configured - skipping email send')
      }

      // Notify household members about the invite
      revalidateTag('household')
      notifyHouseholdEvent(member.household.id, EVENTS.INVITE_SENT, {
        invitation,
        invitedBy: user.name || user.email,
      }).catch(() => {})

      return NextResponse.json({
        invitation: {
          ...invitation,
          inviteLink: inviteLinkUrl,
        },
        emailSent,
        emailError,
      })
    } else {
      // Return shareable link using household inviteToken
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000')
      return NextResponse.json({
        inviteLink: `${baseUrl}/family/accept?token=${member.household.inviteToken}`,
      })
    }
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    )
  }
}
