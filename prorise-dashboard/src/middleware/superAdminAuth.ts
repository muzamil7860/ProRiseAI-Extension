import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { UserRole } from '@prisma/client';

export type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Middleware to protect super admin routes
 * Verifies user is authenticated and has SUPER_ADMIN role
 */
export function withSuperAdmin(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get session
      const session = await getServerSession(req, res, authOptions);

      // Check if user is authenticated
      if (!session || !session.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource'
        });
      }

      // Check if user has SUPER_ADMIN role
      if (session.user.role !== ('SUPER_ADMIN' as any)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource. Super admin access required.'
        });
      }

      // User is authenticated and has SUPER_ADMIN role
      return handler(req, res);
    } catch (error) {
      console.error('Super admin auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while verifying your permissions'
      });
    }
  };
}

/**
 * Middleware to protect admin routes (ADMIN or SUPER_ADMIN)
 * Verifies user is authenticated and has ADMIN or SUPER_ADMIN role
 */
export function withAdmin(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource'
        });
      }

      const userRole = session.user.role;
      const allowedRoles = ['ADMIN' as any, 'SUPER_ADMIN' as any];

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource. Admin access required.'
        });
      }

      return handler(req, res);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while verifying your permissions'
      });
    }
  };
}

/**
 * Check if user has specific role
 */
export async function hasRole(req: NextApiRequest, res: NextApiResponse, role: UserRole): Promise<boolean> {
  try {
    const session = await getServerSession(req, res, authOptions);
    return session?.user?.role === role;
  } catch (error) {
    console.error('Role check error:', error);
    return false;
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  return hasRole(req, res, 'SUPER_ADMIN' as any);
}
