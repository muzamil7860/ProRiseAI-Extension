import React, { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Eye, EyeOff, Copy, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/user/me')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (mounted) setUser(data.user)
      } catch (err) {
        console.error(err)
        if (mounted) setMessage({ type: 'error', text: 'Failed to load settings' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const masked = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.slice(-4)
  }

  const handleCopy = async () => {
    if (!user?.apiKey) return
    try {
      await navigator.clipboard.writeText(user.apiKey)
      setCopied(true)
      setMessage({ type: 'success', text: 'Portal API Key copied to clipboard!' })
      setTimeout(() => {
        setCopied(false)
        setMessage(null)
      }, 2000)
    } catch (err) {
      console.error('copy failed', err)
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' })
    }
  }

  return (
    <AdminLayout userMenu>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and browser extension integration</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7dde4f]"></div>
          </div>
        ) : (
          <>
            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-[#7dde4f] bg-opacity-10 border-[#7dde4f] text-[#7dde4f]'
                    : 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400'
                }`}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {message.text}
              </div>
            )}

            {/* Portal API Key Card */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Portal API Key
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Use this key to connect the ProRise browser extension to your account. The extension will sync all your AI-powered content across LinkedIn, Gmail, and more.
              </p>

              {/* API Key Display */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your API Key
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        readOnly
                        value={user?.apiKey && showKey ? user.apiKey : (user?.apiKey ? masked(user.apiKey) : '')}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white font-mono text-sm cursor-default select-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                      >
                        {showKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${
                        copied
                          ? 'bg-[#7dde4f] text-black'
                          : 'bg-[#7dde4f] text-black hover:bg-[#5ab836]'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Status: <span className="text-[#7dde4f] font-medium">{user?.apiKeyActive ? '✓ Active' : '✗ Inactive'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Setup Instructions Card */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                How to Set Up the Browser Extension
              </h3>

              <ol className="space-y-3">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7dde4f] text-black font-bold flex items-center justify-center text-sm">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Open the ProRise Browser Extension</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click the ProRise icon in your browser toolbar to open the extension.</p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7dde4f] text-black font-bold flex items-center justify-center text-sm">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Go to Settings</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Navigate to the Settings or Options page in the extension menu.</p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7dde4f] text-black font-bold flex items-center justify-center text-sm">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Paste Your API Key</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Find the "Portal API Key" field and paste the key you copied above.</p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7dde4f] text-black font-bold flex items-center justify-center text-sm">
                    4
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Save and Sync</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click Save. Your extension will now sync all your AI-powered content with your ProRise account.</p>
                  </div>
                </li>
              </ol>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">💡 Tip:</span> Once connected, all your LinkedIn posts, comments, generated replies, and rewrites will sync automatically to your ProRise dashboard.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <span className="font-semibold">🔒 Security:</span> Keep your API key private. Never share it with anyone. If you believe your key has been compromised, contact support immediately to regenerate it.
              </p>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
