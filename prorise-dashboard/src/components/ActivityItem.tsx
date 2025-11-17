import React from 'react';
import { Clock } from 'lucide-react';

interface ActivityItemProps {
  description: string;
  date: string;
  amount?: number;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ description, date, amount }) => (
  <li className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-700">
      <Clock className="w-4 h-4" />
    </div>
    <div className="flex-1">
      <div className="text-sm text-gray-300">{description}</div>
      <div className="text-xs text-gray-400">{date}{amount !== undefined && ` • $${amount.toFixed(2)}`}</div>
    </div>
  </li>
);

export default ActivityItem;
