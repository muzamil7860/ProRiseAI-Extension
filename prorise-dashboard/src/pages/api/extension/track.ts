import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * API Route: /api/extension/track
 * Tracks usage from extension and updates stats in real-time
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, action, details } = req.body;

    if (!apiKey || !action) {
      return res.status(400).json({ error: 'API key and action are required' });
    }

    // Validate action type
    const validActions: string[] = [
      'POST_CREATED',
      'COMMENT_ENHANCED',
      'REPLY_SUGGESTED',
      'TEXT_REWRITTEN',
      'MESSAGE_REPLIED',
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    // Find user
    const user: any = await prisma.user.findUnique({
      where: { apiKey } as any,
      include: {
        plan: true,
        stats: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (!user.apiKeyActive) {
      return res.status(403).json({ error: 'API key has been deactivated' });
    }

    if (!user.plan) {
      return res.status(403).json({ error: 'No active plan' });
    }

    // Check limits before allowing action
    const currentStats = user.stats || {
      postsCreated: 0,
      commentsEnhanced: 0,
      repliesSuggested: 0,
      textsRewritten: 0,
      totalUsage: 0,
    };

    // Check plan limits
    if (currentStats.totalUsage >= user.plan.totalUsageLimit) {
      return res.status(429).json({ 
        error: 'Monthly usage limit reached',
        limit: user.plan.totalUsageLimit,
        used: currentStats.totalUsage,
      });
    }

    // Check specific action limits
    switch (action) {
      case 'POST_CREATED':
        if (currentStats.postsCreated >= user.plan.postsLimit) {
          return res.status(429).json({ 
            error: 'Posts limit reached',
            limit: user.plan.postsLimit,
            used: currentStats.postsCreated,
          });
        }
        break;
      case 'COMMENT_ENHANCED':
        if (currentStats.commentsEnhanced >= user.plan.commentsLimit) {
          return res.status(429).json({ 
            error: 'Comments limit reached',
            limit: user.plan.commentsLimit,
            used: currentStats.commentsEnhanced,
          });
        }
        break;
      case 'REPLY_SUGGESTED':
        if (currentStats.repliesSuggested >= user.plan.repliesLimit) {
          return res.status(429).json({ 
            error: 'Replies limit reached',
            limit: user.plan.repliesLimit,
            used: currentStats.repliesSuggested,
          });
        }
        break;
      case 'TEXT_REWRITTEN':
        if (currentStats.textsRewritten >= user.plan.rewritesLimit) {
          return res.status(429).json({ 
            error: 'Rewrites limit reached',
            limit: user.plan.rewritesLimit,
            used: currentStats.textsRewritten,
          });
        }
        break;
    }

    // Update stats and log usage
    await prisma.$transaction(async (tx: any) => {
      // Create usage log
      await tx.usageLog.create({
        data: {
          userId: user.id,
          action,
          details: details || {},
        },
      });

      // Update user stats
      const updateData: any = {
        totalUsage: { increment: 1 },
        lastUsedAt: new Date(),
      };

      switch (action) {
        case 'POST_CREATED':
          updateData.postsCreated = { increment: 1 };
          break;
        case 'COMMENT_ENHANCED':
          updateData.commentsEnhanced = { increment: 1 };
          break;
        case 'REPLY_SUGGESTED':
          updateData.repliesSuggested = { increment: 1 };
          break;
        case 'TEXT_REWRITTEN':
          updateData.textsRewritten = { increment: 1 };
          break;
        case 'MESSAGE_REPLIED':
          updateData.repliesSuggested = { increment: 1 };
          break;
      }

      await tx.userStats.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...Object.keys(updateData).reduce((acc, key) => {
            if (key !== 'lastUsedAt') {
              acc[key] = updateData[key].increment || 1;
            }
            return acc;
          }, {} as any),
          lastUsedAt: new Date(),
        },
        update: updateData,
      });
    });

    // Get updated stats
    const updatedStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Usage tracked successfully',
      usage: {
        postsCreated: updatedStats?.postsCreated || 0,
        commentsEnhanced: updatedStats?.commentsEnhanced || 0,
        repliesSuggested: updatedStats?.repliesSuggested || 0,
        textsRewritten: updatedStats?.textsRewritten || 0,
        totalUsage: updatedStats?.totalUsage || 0,
      },
      remaining: {
        posts: user.plan.postsLimit - (updatedStats?.postsCreated || 0),
        comments: user.plan.commentsLimit - (updatedStats?.commentsEnhanced || 0),
        replies: user.plan.repliesLimit - (updatedStats?.repliesSuggested || 0),
        rewrites: user.plan.rewritesLimit - (updatedStats?.textsRewritten || 0),
        total: user.plan.totalUsageLimit - (updatedStats?.totalUsage || 0),
      },
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
