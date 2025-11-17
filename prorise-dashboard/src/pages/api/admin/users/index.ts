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

  try {
    if (req.method === 'GET') {
      const { search, role, page = '1', limit = '10' } = req.query;
      
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search as string } },
          { name: { contains: search as string } }
        ];
      }
      
      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        (prisma as any).user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            plan: true,
            stats: true
          }
        }),
        (prisma as any).user.count({ where })
      ]);

      const sanitizedUsers = users.map((user: any) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return res.status(200).json({
        users: sanitizedUsers,
        total,
        page: parseInt(page as string),
        totalPages: Math.ceil(total / take)
      });
    }

    if (req.method === 'POST') {
      const { email, name, password, role = 'USER', planId } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const existingUser = await (prisma as any).user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await (prisma as any).user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role,
          planId,
          stats: {
            create: {}
          }
        },
        include: {
          plan: true,
          stats: true
        }
      });

      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json(userWithoutPassword);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
