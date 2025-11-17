import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import Head from 'next/head'
import AdminLayout from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TrendingUp, FileText, MessageSquare, Zap, BarChart2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ActivityItem from '@/components/ActivityItem';
import dynamic from 'next/dynamic';

// Dynamically import Recharts to avoid SSR issues
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
// ...existing code...

interface UserStats {
  postsCreated: number
  commentsEnhanced: number
  repliesSuggested: number
  textsRewritten: number
  totalUsage: number
}

interface Plan {
  id: string
  name: string
  price: number
}

interface Purchase {
  id: string
  purchaseDate: string
  amount: number
  plan: Plan
}

interface User {
  name?: string
  email: string
  plan?: Plan
  stats?: UserStats
  purchases: Purchase[]
}

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session) {
      fetchDashboard()
    }
  }, [session, status])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Dashboard error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-slow text-2xl text-primary">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = user.stats || {
    postsCreated: 0,
    commentsEnhanced: 0,
    repliesSuggested: 0,
    textsRewritten: 0,
    totalUsage: 0,
  }

  return (
    <ThemeProvider>
      <AdminLayout userMenu>
        <Head>
          <title>Dashboard - ProRise AI</title>
        </Head>
        {/* ...existing dashboard content (hero, stats, charts, activity) goes here, but without duplicate layout/header) ... */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your personal AI assistant summary.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Posts Created" value={stats.postsCreated} icon={FileText} color="linear-gradient(135deg,#7dde4f,#5ab836)" />
          <StatCard title="Comments Enhanced" value={stats.commentsEnhanced} icon={MessageSquare} color="linear-gradient(135deg,#5ab836,#9ef06f)" />
          <StatCard title="Replies Suggested" value={stats.repliesSuggested} icon={Zap} color="linear-gradient(135deg,#9ef06f,#f59e0b)" />
          <StatCard title="Texts Rewritten" value={stats.textsRewritten} icon={TrendingUp} color="linear-gradient(135deg,#f59e0b,#7dde4f)" />
        </div>

        {/* Recent Activity */}
        <div className="card p-6 mb-8">
          <h4 className="text-lg font-semibold mb-3">Recent Activity</h4>
          <ul className="space-y-3">
            {(user.purchases || []).slice(0, 5).map((p) => (
              <ActivityItem
                key={p.id}
                description={`Purchased ${p.plan.name}`}
                date={new Date(p.purchaseDate).toLocaleString()}
                amount={p.amount}
              />
            ))}
            {(!user.purchases || user.purchases.length === 0) && (
              <li className="text-sm text-gray-400">No recent purchases</li>
            )}
          </ul>
        </div>
      </AdminLayout>
    </ThemeProvider>
  );
}
