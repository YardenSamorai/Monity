import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/api-tokens/[id] - Delete API token
export async function DELETE(request, { params }) {
  try {
    const user = await getOrCreateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const apiToken = await prisma.apiToken.findFirst({
      where: { id, userId: user.id },
    })

    if (!apiToken) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    // Delete the token
    await prisma.apiToken.delete({
      where: { id },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Token deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting API token:', error)
    return NextResponse.json(
      { error: 'Failed to delete API token' },
      { status: 500 }
    )
  }
}

