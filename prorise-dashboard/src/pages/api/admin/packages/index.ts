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
      const packages = await (prisma as any).plan.findMany({
        orderBy: { price: 'asc' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });

      return res.status(200).json(packages);
    }

    if (req.method === 'POST') {
      const { name, description, price, limits, durationDays, isActive = true } = req.body;

      if (!name || price === undefined || !limits) {
        return res.status(400).json({ message: 'Name, price, and limits are required' });
      }

      const plan = await (prisma as any).plan.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          limits,
          durationDays: durationDays || 30,
          isActive
        }
      });

      return res.status(201).json(plan);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Packages API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
