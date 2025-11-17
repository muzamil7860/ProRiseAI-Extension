import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        </div>
        <div className="bg-white dark:bg-[#181818] rounded-xl shadow p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Analytics dashboard coming soon. Here you will see user activity, package usage, payment stats, and more.</p>
          {/* Add analytics graphs and stats here */}
        </div>
      </div>
    </AdminLayout>
  );
}
