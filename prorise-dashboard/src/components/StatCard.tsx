import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = '#7dde4f' }) => (
  <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#2a2a2a] flex items-center gap-4">
    <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: color }}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default StatCard;
