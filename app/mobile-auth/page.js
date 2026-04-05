import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiToken } from '@/lib/utils'
import MobileAuthRedirect from './redirect'

export default async function MobileAuth() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in?redirect_url=/mobile-auth')
  }

  const user = await getOrCreateUser()
  if (!user) {
    redirect('/sign-in?redirect_url=/mobile-auth')
  }

  const token = generateApiToken()
  await prisma.apiToken.create({
    data: {
      userId: user.id,
      token,
      name: 'MonityIOS',
    },
  })

  return <MobileAuthRedirect token={token} />
}
