import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Verify authentication with NextAuth
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Get user dashboard data
    const user = await (prisma as any).user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
        stats: true,
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 10,
          include: {
            plan: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return res.status(200).json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Dashboard error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
