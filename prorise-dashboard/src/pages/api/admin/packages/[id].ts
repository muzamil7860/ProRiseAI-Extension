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
    return res.status(400).json({ message: 'Invalid package ID' });
  }

  try {
    if (req.method === 'PUT') {
      const { name, description, price, limits, durationDays, isActive } = req.body;

      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (limits) updateData.limits = limits;
      if (durationDays !== undefined) updateData.durationDays = durationDays;
      if (isActive !== undefined) updateData.isActive = isActive;

      const plan = await (prisma as any).plan.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: { users: true }
          }
        }
      });

      return res.status(200).json(plan);
    }

    if (req.method === 'DELETE') {
      // Check if any users are using this plan
      const usersWithPlan = await (prisma as any).user.count({
        where: { planId: id }
      });

      if (usersWithPlan > 0) {
        return res.status(400).json({ 
          message: `Cannot delete package. ${usersWithPlan} user(s) are currently using this plan.` 
        });
      }

      await (prisma as any).plan.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Package deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Package API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
