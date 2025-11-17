import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Clock, User, Calendar, CreditCard, Filter } from 'lucide-react';

interface Purchase {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  plan: {
    id: string;
    name: string;
    price: number;
  };
}

interface PaymentsData {
  purchases: Purchase[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    pending: number;
    completed: number;
  };
}

export default function PaymentsPage() {
  const [paymentsData, setPaymentsData] = useState<PaymentsData>({
    purchases: [],
    total: 0,
    page: 1,
    totalPages: 0,
    stats: { pending: 0, completed: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentsData(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter]);

  const handleApprove = async (purchaseId: string) => {
    if (!confirm('Approve this payment and assign the package to the user?')) return;

    setProcessingId(purchaseId);
    try {
      const response = await fetch(`/api/admin/payments/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          assignPackage: true
        })
      });

      if (response.ok) {
        fetchPayments();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (purchaseId: string) => {
    if (!confirm('Reject this payment?')) return;

    setProcessingId(purchaseId);
    try {
      const response = await fetch(`/api/admin/payments/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FAILED'
        })
      });

      if (response.ok) {
        fetchPayments();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 bg-[#7dde4f] text-black text-xs font-semibold rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-semibold rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and approve payment transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{paymentsData.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#7dde4f] bg-opacity-20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#7dde4f]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{paymentsData.stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{paymentsData.stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-[#7dde4f] bg-opacity-20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#7dde4f]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7dde4f]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#2a2a2a]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                    {paymentsData.purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-[#7dde4f]" />
                              {purchase.paymentMethod}
                            </div>
                            {purchase.transactionId && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {purchase.transactionId.substring(0, 16)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{purchase.user.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {purchase.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{purchase.plan.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-[#7dde4f]">${purchase.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(purchase.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(purchase.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {purchase.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(purchase.id)}
                                disabled={processingId === purchase.id}
                                className="px-3 py-1 bg-[#7dde4f] text-black font-medium rounded hover:bg-[#5ab836] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(purchase.id)}
                                disabled={processingId === purchase.id}
                                className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {purchase.status === 'COMPLETED' && (
                            <span className="text-gray-400 text-xs">Completed</span>
                          )}
                          {purchase.status === 'FAILED' && (
                            <span className="text-gray-400 text-xs">Rejected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paymentsData.purchases.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <DollarSign className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No transactions yet</p>
                    <p className="text-sm">Payments will appear here once users make purchases</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {paymentsData.totalPages > 1 && (
                <div className="bg-white dark:bg-[#1a1a1a] px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 20, paymentsData.total)}</span> of{' '}
                    <span className="font-medium">{paymentsData.total}</span> transactions
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(paymentsData.totalPages, p + 1))}
                      disabled={currentPage === paymentsData.totalPages}
                      className="px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
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
