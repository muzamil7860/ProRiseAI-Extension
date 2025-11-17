import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Users, Calendar, Activity, Check, X } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  limits: {
    postsPerMonth: number;
    commentsPerMonth: number;
    repliesPerMonth: number;
    rewritesPerMonth: number;
  };
  durationDays: number;
  isActive: boolean;
  _count: {
    users: number;
  };
}

interface FormData {
  name: string;
  description: string;
  price: string;
  postsPerMonth: string;
  commentsPerMonth: string;
  repliesPerMonth: string;
  rewritesPerMonth: string;
  durationDays: string;
  isActive: boolean;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    postsPerMonth: '',
    commentsPerMonth: '',
    repliesPerMonth: '',
    rewritesPerMonth: '',
    durationDays: '30',
    isActive: true
  });

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      postsPerMonth: '',
      commentsPerMonth: '',
      repliesPerMonth: '',
      rewritesPerMonth: '',
      durationDays: '30',
      isActive: true
    });
    setEditingId(null);
  };

  const handleEdit = (pkg: Package) => {
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      postsPerMonth: pkg.limits.postsPerMonth.toString(),
      commentsPerMonth: pkg.limits.commentsPerMonth.toString(),
      repliesPerMonth: pkg.limits.repliesPerMonth.toString(),
      rewritesPerMonth: pkg.limits.rewritesPerMonth.toString(),
      durationDays: pkg.durationDays.toString(),
      isActive: pkg.isActive
    });
    setEditingId(pkg.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      limits: {
        postsPerMonth: parseInt(formData.postsPerMonth),
        commentsPerMonth: parseInt(formData.commentsPerMonth),
        repliesPerMonth: parseInt(formData.repliesPerMonth),
        rewritesPerMonth: parseInt(formData.rewritesPerMonth)
      },
      durationDays: parseInt(formData.durationDays),
      isActive: formData.isActive
    };

    try {
      const url = editingId ? `/api/admin/packages/${editingId}` : '/api/admin/packages';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchPackages();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save package');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const response = await fetch(`/api/admin/packages/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPackages();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Package Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage subscription packages</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#7dde4f] text-black font-medium rounded-lg hover:bg-[#5ab836] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Package
          </button>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7dde4f]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{pkg.description}</p>
                    )}
                  </div>
                  {pkg.isActive ? (
                    <span className="px-2 py-1 bg-[#7dde4f] text-black text-xs font-semibold rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#7dde4f]">${pkg.price}</span>
                    <span className="text-gray-600 dark:text-gray-400">/{pkg.durationDays} days</span>
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-3 mb-4 p-4 bg-gray-50 dark:bg-[#0f0f0f] rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#7dde4f]" />
                    Monthly Limits
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Posts:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{pkg.limits.postsPerMonth}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Comments:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{pkg.limits.commentsPerMonth}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Replies:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{pkg.limits.repliesPerMonth}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Rewrites:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{pkg.limits.rewritesPerMonth}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{pkg._count.users} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{pkg.durationDays} days</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {packages.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <DollarSign className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No packages yet</p>
                <p className="text-sm">Create your first subscription package to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg max-w-2xl w-full p-6 border border-gray-200 dark:border-[#2a2a2a] my-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingId ? 'Edit Package' : 'Add New Package'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Name*</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="e.g., Premium Plan"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="Brief description of the package"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)*</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="29.99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Days)*</label>
                    <input
                      type="number"
                      required
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="30"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#7dde4f]" />
                      Monthly Usage Limits
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Posts per Month*</label>
                    <input
                      type="number"
                      required
                      value={formData.postsPerMonth}
                      onChange={(e) => setFormData({ ...formData, postsPerMonth: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments per Month*</label>
                    <input
                      type="number"
                      required
                      value={formData.commentsPerMonth}
                      onChange={(e) => setFormData({ ...formData, commentsPerMonth: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Replies per Month*</label>
                    <input
                      type="number"
                      required
                      value={formData.repliesPerMonth}
                      onChange={(e) => setFormData({ ...formData, repliesPerMonth: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rewrites per Month*</label>
                    <input
                      type="number"
                      required
                      value={formData.rewritesPerMonth}
                      onChange={(e) => setFormData({ ...formData, rewritesPerMonth: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                      placeholder="50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-[#7dde4f] border-gray-300 rounded focus:ring-[#7dde4f]"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active (visible to users)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#7dde4f] text-black font-medium rounded-lg hover:bg-[#5ab836] transition-colors"
                  >
                    {editingId ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
