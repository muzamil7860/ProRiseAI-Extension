import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const purchaseSchema = z.object({
  planId: z.string(),
  paymentMethod: z.string().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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

    const { planId, paymentMethod } = purchaseSchema.parse(req.body)

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' })
    }

    // Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId: decoded.userId,
        planId: plan.id,
        amount: plan.price,
        status: 'COMPLETED', // In production, this would be PENDING until payment confirmation
        paymentMethod: paymentMethod || 'stripe',
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: {
        plan: true,
      },
    })

    // Update user's plan
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { planId: plan.id },
    })

    return res.status(201).json({
      purchase,
      message: 'Purchase successful',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors })
    }
    console.error('Purchase error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
