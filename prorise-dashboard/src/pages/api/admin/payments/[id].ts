import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid purchase ID' });
  }

  try {
    if (req.method === 'PUT') {
      const { status, assignPackage } = req.body;

      const purchase = await (prisma as any).purchase.findUnique({
        where: { id },
        include: { user: true, plan: true }
      });

      if (!purchase) {
        return res.status(404).json({ message: 'Purchase not found' });
      }

      // Update purchase status
      const updateData: any = {};
      if (status) {
        updateData.status = status;
      }

      const updatedPurchase = await (prisma as any).purchase.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true
            }
          }
        }
      });

      // If approved and assignPackage is true, assign the plan to the user
      if (status === 'COMPLETED' && assignPackage) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + purchase.plan.durationDays);

        await (prisma as any).user.update({
          where: { id: purchase.userId },
          data: {
            planId: purchase.planId,
            planExpiry: expiryDate
          }
        });

        // Reset user stats for the new billing period
        await (prisma as any).userStats.update({
          where: { userId: purchase.userId },
          data: {
            postsCreated: 0,
            commentsEnhanced: 0,
            repliesSuggested: 0,
            textsRewritten: 0
          }
        });
      }

      return res.status(200).json(updatedPurchase);
    }

    if (req.method === 'DELETE') {
      await (prisma as any).purchase.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Purchase deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Payment API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
