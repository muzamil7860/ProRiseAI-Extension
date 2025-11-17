import type { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';
import dynamic from 'next/dynamic';
import { TrendingUp, Users, DollarSign, ShoppingCart, Activity } from 'lucide-react';

// Dynamically import Recharts to avoid SSR issues
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7dde4f]"></div>
          </div>
        </AdminLayout>
      </ThemeProvider>
    );
  }

  const usageData = [
    { name: 'Posts Created', value: data?.usage?.postsCreated || 0, color: '#7dde4f' },
    { name: 'Comments Enhanced', value: data?.usage?.commentsEnhanced || 0, color: '#5ab836' },
    { name: 'Replies Suggested', value: data?.usage?.repliesSuggested || 0, color: '#9ef06f' },
    { name: 'Texts Rewritten', value: data?.usage?.textsRewritten || 0, color: '#f59e0b' },
  ];

  return (
    <ThemeProvider>
      <AdminLayout>
        <Head>
          <title>Admin Dashboard - ProRise AI</title>
        </Head>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your platform.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats?.totalUsers || 0}</h3>
                <p className="text-sm text-[#7dde4f] mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{data?.stats?.activeUsers || 0} active</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-[#7dde4f]/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#7dde4f]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${data?.stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
                <p className="text-sm text-[#7dde4f] mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5%</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-[#5ab836]/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#5ab836]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Orders</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats?.pendingPurchases || 0}</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">Needs approval</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Usage</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data?.usage?.total || 0}</h3>
                <p className="text-sm text-[#9ef06f] mt-2">API Calls</p>
              </div>
              <div className="w-12 h-12 bg-[#9ef06f]/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#9ef06f]" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
            {typeof window !== 'undefined' && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.charts?.revenue || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7dde4f" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7dde4f" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#7dde4f" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Growth</h3>
            {typeof window !== 'undefined' && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.charts?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#7dde4f" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Usage & Purchases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Usage Distribution</h3>
            {typeof window !== 'undefined' && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {usageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Purchases</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data?.recentPurchases?.map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2a2a2a]/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{purchase.user}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{purchase.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#7dde4f]">${purchase.amount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(purchase.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ThemeProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if ((session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
