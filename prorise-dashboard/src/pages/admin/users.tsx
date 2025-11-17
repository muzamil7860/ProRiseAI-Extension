import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Calendar, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  plan?: {
    name: string;
  } | null;
  stats?: {
    postsCreated: number;
    commentsEnhanced: number;
    repliesSuggested: number;
    textsRewritten: number;
  } | null;
}

interface UsersData {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UsersPage() {
  const [usersData, setUsersData] = useState<UsersData>({ users: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'USER'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsersData(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ email: '', name: '', password: '', role: 'USER' });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-[#7dde4f] text-black';
      case 'ADMIN':
        return 'bg-[#5ab836] text-white';
      default:
        return 'bg-gray-600 dark:bg-gray-700 text-white';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all users and their permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7dde4f] text-black font-medium rounded-lg hover:bg-[#5ab836] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New User
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#7dde4f]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </form>
        </div>

        {/* Users Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usage Stats</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                    {usersData.users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#7dde4f] rounded-full flex items-center justify-center">
                              <span className="text-black font-bold">
                                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {user.plan?.name || <span className="text-gray-400">No Plan</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {user.stats ? (
                            <div className="text-xs">
                              <div>Posts: {user.stats.postsCreated}</div>
                              <div>Comments: {user.stats.commentsEnhanced}</div>
                              <div>Replies: {user.stats.repliesSuggested}</div>
                              <div>Rewrites: {user.stats.textsRewritten}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-[#7dde4f] hover:text-[#5ab836] mr-3">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white dark:bg-[#1a1a1a] px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * 10, usersData.total)}</span> of{' '}
                  <span className="font-medium">{usersData.total}</span> users
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
                    onClick={() => setCurrentPage(p => Math.min(usersData.totalPages, p + 1))}
                    disabled={currentPage === usersData.totalPages}
                    className="px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email*</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password*</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role*</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#7dde4f] text-black font-medium rounded-lg hover:bg-[#5ab836] transition-colors"
                  >
                    Add User
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
