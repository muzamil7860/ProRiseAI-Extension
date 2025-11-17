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

  try {
    if (req.method === 'GET') {
      const { status, page = '1', limit = '20' } = req.query;
      
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {};
      
      if (status) {
        where.status = status;
      }

      const [purchases, total, pendingCount, completedCount] = await Promise.all([
        (prisma as any).purchase.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
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
        }),
        (prisma as any).purchase.count({ where }),
        (prisma as any).purchase.count({ where: { status: 'PENDING' } }),
        (prisma as any).purchase.count({ where: { status: 'COMPLETED' } })
      ]);

      return res.status(200).json({
        purchases,
        total,
        page: parseInt(page as string),
        totalPages: Math.ceil(total / take),
        stats: {
          pending: pendingCount,
          completed: completedCount
        }
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Payments API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
