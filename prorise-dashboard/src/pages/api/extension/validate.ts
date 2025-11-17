import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API Route: /api/extension/validate
 * Validates API key and returns user plan data with limits
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS: allow extension popups and local dev to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  // Respond to preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ message: 'API key is required' });
    }

    // Find user by API key
    const user: any = await prisma.user.findUnique({
      where: { apiKey } as any,
      include: {
        plan: true,
        stats: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    if (!user.apiKeyActive) {
      return res.status(403).json({ message: 'API key has been deactivated' });
    }

    // Check if user has active plan
    if (!user.plan) {
      return res.status(403).json({ 
        message: 'No active plan. Please subscribe to a plan.',
        requiresPlan: true 
      });
    }

    // Extract limits from JSON field
    const planLimits = (user.plan.limits as any) || {};

    // Return user data with limits
    return res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      plan: {
        name: user.plan.name,
        limits: planLimits,
      },
      usage: {
        postsCreated: user.stats?.postsCreated || 0,
        commentsEnhanced: user.stats?.commentsEnhanced || 0,
        repliesSuggested: user.stats?.repliesSuggested || 0,
        textsRewritten: user.stats?.textsRewritten || 0,
        totalUsage: user.stats?.totalUsage || 0,
        lastResetAt: user.stats?.lastResetAt,
      },
    });
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
