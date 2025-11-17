import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    if (req.method === 'PUT') {
      const { email, name, password, role, planId } = req.body;

      const updateData: any = {};
      
      if (email) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (role) updateData.role = role;
      if (planId !== undefined) updateData.planId = planId;
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await (prisma as any).user.update({
        where: { id },
        data: updateData,
        include: {
          plan: true,
          stats: true
        }
      });

      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json(userWithoutPassword);
    }

    if (req.method === 'DELETE') {
      // Don't allow deleting yourself
      if (id === session.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      await (prisma as any).user.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
