import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // getServerSession's returned type can be loosely typed in this project; cast to any
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        apiKey: true,
        apiKeyActive: true,
        createdAt: true,
      },
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    // Return user's portal API key (this is safe for the authenticated user to view/copy)
    return res.status(200).json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
