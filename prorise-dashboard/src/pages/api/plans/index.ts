import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    return res.status(200).json({ plans })
  } catch (error) {
    console.error('Plans fetch error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
