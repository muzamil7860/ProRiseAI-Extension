import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    if (req.method === 'GET') {
      // Get user stats
      const stats = await prisma.userStats.findUnique({
        where: { userId: decoded.userId },
      })

      return res.status(200).json({ stats })
    }

    if (req.method === 'POST') {
      // Update user stats
      const { postsCreated, commentsEnhanced, repliesSuggested, textsRewritten } = req.body

      const stats = await prisma.userStats.update({
        where: { userId: decoded.userId },
        data: {
          postsCreated: { increment: postsCreated || 0 },
          commentsEnhanced: { increment: commentsEnhanced || 0 },
          repliesSuggested: { increment: repliesSuggested || 0 },
          textsRewritten: { increment: textsRewritten || 0 },
          totalUsage: { increment: (postsCreated || 0) + (commentsEnhanced || 0) + (repliesSuggested || 0) + (textsRewritten || 0) },
          lastUsedAt: new Date(),
        },
      })

      return res.status(200).json({ stats })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Stats error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
