import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  TrendingUp,
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode;
  userMenu?: boolean;
}

export default function AdminLayout({ children, userMenu }: AdminLayoutProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User menu for non-admins
  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Plans', href: '/plans', icon: Package },
    { name: 'Usage', href: '/usage', icon: TrendingUp },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Admin menu (default)
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Packages', href: '/admin/packages', icon: Package },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  // Use router.pathname for SSR/CSR consistency
  const isAdminRoute = router.pathname.startsWith('/admin');
  const navigation = isAdminRoute ? adminNavigation : userNavigation;
  // If userMenu prop is set, force user menu
  const finalNavigation = isAdminRoute && !userMenu ? adminNavigation : userMenu ? userNavigation : navigation;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-[#0f0f0f]' : 'bg-gray-50'}`}>
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden lg:block ${
          theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
        } border-r`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={`flex items-center justify-between px-4 py-6 ${
            theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'
          } border-b`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7dde4f] flex items-center justify-center font-bold text-xl text-black">
                P
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    ProRise AI
                  </h1>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Admin Panel
                  </p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-1.5 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {finalNavigation.map((item) => {
                const isActive = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? theme === 'dark'
                            ? 'bg-[#7dde4f] text-black'
                            : 'bg-[#7dde4f] text-black'
                          : theme === 'dark'
                          ? 'text-gray-300 hover:bg-[#2a2a2a]'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Theme Toggle & Logout */}
          <div className={`p-3 ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'} border-t space-y-2`}>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'text-gray-300 hover:bg-[#2a2a2a]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Moon className="w-5 h-5 flex-shrink-0" />
              )}
              {sidebarOpen && (
                <span className="font-medium">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'text-[#7dde4f] hover:bg-[#2a2a2a]'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>

          {/* Collapse Button */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-3 ${
                theme === 'dark'
                  ? 'hover:bg-[#2a2a2a] text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              } transition-colors`}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 ${
        theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
      } border-b`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7dde4f] flex items-center justify-center font-bold text-black">
            P
          </div>
          <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-bold`}>ProRise Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2 ${
            theme === 'dark' ? 'text-gray-300 hover:bg-[#2a2a2a]' : 'text-gray-700 hover:bg-gray-100'
          } rounded-lg`}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`lg:hidden fixed inset-0 z-40 pt-16 ${
          theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-gray-50'
        }`}>
          <nav className="p-4">
            <ul className="space-y-2">
              {finalNavigation.map((item) => {
                const isActive = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                        isActive
                          ? 'bg-[#7dde4f] text-black'
                          : theme === 'dark'
                          ? 'text-gray-300 hover:bg-[#2a2a2a]'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className={`mt-6 pt-6 border-t ${
              theme === 'dark' ? 'border-[#2a2a2a]' : 'border-gray-200'
            } space-y-2`}>
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  theme === 'dark' ? 'text-gray-300 hover:bg-[#2a2a2a]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  theme === 'dark' ? 'text-[#7dde4f] hover:bg-[#2a2a2a]' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } pt-16 lg:pt-0`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
