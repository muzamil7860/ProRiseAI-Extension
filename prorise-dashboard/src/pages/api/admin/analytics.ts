import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check if user is admin or super admin
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    // Get total users count
    const totalUsers = await (prisma as any).user.count()
    
    // Get active users (users who used the service in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeUsers = await (prisma as any).userStats.count({
      where: {
        lastUsedAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get total revenue
    const purchases = await (prisma as any).purchase.findMany({
      where: {
        status: 'COMPLETED'
      },
      select: {
        amount: true,
        purchaseDate: true
      }
    })

    const totalRevenue = purchases.reduce((sum: number, p: any) => sum + p.amount, 0)

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyRevenue = purchases
      .filter((p: any) => new Date(p.purchaseDate) >= sixMonthsAgo)
      .reduce((acc: any, p: any) => {
        const month = new Date(p.purchaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        acc[month] = (acc[month] || 0) + p.amount
        return acc
      }, {})

    // Get user growth for the last 6 months
    const users = await (prisma as any).user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const userGrowth = users.reduce((acc: any, u: any) => {
      const month = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    // Get usage stats
    const allStats = await (prisma as any).userStats.findMany()
    const totalUsage = allStats.reduce((acc: any, stat: any) => ({
      postsCreated: acc.postsCreated + stat.postsCreated,
      commentsEnhanced: acc.commentsEnhanced + stat.commentsEnhanced,
      repliesSuggested: acc.repliesSuggested + stat.repliesSuggested,
      textsRewritten: acc.textsRewritten + stat.textsRewritten,
      total: acc.total + stat.totalUsage
    }), {
      postsCreated: 0,
      commentsEnhanced: 0,
      repliesSuggested: 0,
      textsRewritten: 0,
      total: 0
    })

    // Get top users by usage
    const topUsers = await (prisma as any).user.findMany({
      include: {
        stats: true,
        plan: true
      },
      orderBy: {
        stats: {
          totalUsage: 'desc'
        }
      },
      take: 10
    })

    // Get recent purchases
    const recentPurchases = await (prisma as any).purchase.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        plan: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      },
      take: 10
    })

    // Get pending purchases
    const pendingPurchases = await (prisma as any).purchase.count({
      where: {
        status: 'PENDING'
      }
    })

    // Format data for charts
    const revenueChartData = Object.entries(monthlyRevenue).map(([month, amount]) => ({
      month,
      revenue: amount
    }))

    const userGrowthChartData = Object.entries(userGrowth).map(([month, count]) => ({
      month,
      users: count
    }))

    return res.status(200).json({
      stats: {
        totalUsers,
        activeUsers,
        totalRevenue,
        pendingPurchases
      },
      charts: {
        revenue: revenueChartData,
        userGrowth: userGrowthChartData
      },
      usage: totalUsage,
      topUsers: topUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan?.name || 'Free',
        totalUsage: u.stats?.totalUsage || 0
      })),
      recentPurchases: recentPurchases.map((p: any) => ({
        id: p.id,
        user: p.user.name || p.user.email,
        plan: p.plan.name,
        amount: p.amount,
        status: p.status,
        date: p.purchaseDate
      }))
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
