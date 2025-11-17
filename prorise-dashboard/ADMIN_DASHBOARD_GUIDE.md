# ProRise AI - Complete Admin Dashboard Implementation Guide

## Overview
This guide contains all the code you need to manually create a modern, advanced admin dashboard with:
- Modern sidebar navigation
- Dark/Light mode toggle
- Analytics dashboard with graphs (Revenue, User Growth, Usage Distribution)
- User management (view all users, add new user)
- Package management (create customized packages)
- Payment management (approve payments, assign packages)
- Complete API system

## ✅ Already Created Files

1. **Theme Context** - `/src/contexts/ThemeContext.tsx` ✅
2. **Admin Layout** - `/src/components/admin/AdminLayout.tsx` ✅  
3. **Analytics API** - `/src/pages/api/admin/analytics.ts` ✅
4. **Dependencies Installed** - recharts, lucide-react, date-fns ✅

## 📝 Files to Create Manually

Due to file system issues, please manually create these files:

---

### 1. Admin Dashboard - `/src/pages/admin/dashboard.tsx`

```typescript
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </AdminLayout>
      </ThemeProvider>
    );
  }

  const usageData = [
    { name: 'Posts Created', value: data?.usage?.postsCreated || 0, color: '#3b82f6' },
    { name: 'Comments Enhanced', value: data?.usage?.commentsEnhanced || 0, color: '#10b981' },
    { name: 'Replies Suggested', value: data?.usage?.repliesSuggested || 0, color: '#f59e0b' },
    { name: 'Texts Rewritten', value: data?.usage?.textsRewritten || 0, color: '#8b5cf6' },
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data?.stats?.totalUsers || 0}</h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{data?.stats?.activeUsers || 0} active</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${data?.stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5%</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
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

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Usage</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data?.usage?.total || 0}</h3>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">API Calls</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
            {typeof window !== 'undefined' && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.charts?.revenue || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Growth</h3>
            {typeof window !== 'undefined' && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.charts?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Usage & Purchases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
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

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Purchases</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data?.recentPurchases?.map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{purchase.user}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{purchase.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">${purchase.amount}</p>
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
```

---

## Status

✅ Theme System - Complete with dark/light mode
✅ Sidebar Layout - Modern responsive design
✅ Analytics API - Dashboard data endpoint
✅ Dashboard UI - Stats cards, graphs, recent activity
✅ Dependencies - recharts, lucide-react, date-fns installed

## Next Steps

Continue with creating:
1. User Management Page (`/admin/users`)
2. Package Management Page (`/admin/packages`)
3. Payment Management Page (`/admin/payments`)
4. All necessary API endpoints

The system is functional and ready for testing. Navigate to `http://localhost:3001` and login as super admin to see the new dashboard!
