import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { Shield, Settings as SettingsIcon, Mail, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';

interface SystemSettingsData {
  openaiApiKey: string | null;
  hasApiKey: boolean;
  openaiModel: string;
  maxTokens: number;
  systemEmail: string | null;
  maintenanceMode: boolean;
  allowRegistration: boolean;
}

interface Props {
  initialSettings: SystemSettingsData;
}

export default function SystemSettings({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setFetchingSettings(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openaiApiKey: openaiKey || undefined,
          openaiModel: settings.openaiModel,
          maxTokens: settings.maxTokens,
          systemEmail: settings.systemEmail || undefined,
          maintenanceMode: settings.maintenanceMode,
          allowRegistration: settings.allowRegistration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update settings');
      }

      setSettings(data.settings);
      setOpenaiKey(''); // Clear the input after successful save
      setMessage({ type: 'success', text: data.message || 'Settings updated successfully' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update settings',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure system-wide settings and integrations</p>
        </div>

        {/* Loading State */}
        {fetchingSettings ? (
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

            {/* OpenAI Configuration */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#7dde4f]" />
                OpenAI Configuration
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Configure the OpenAI API key that will be used for all users. This key is encrypted and stored securely.
              </p>

              <div className="space-y-4">
                {/* API Key Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current API Key Status
                  </label>
                  <div className="flex items-center gap-2">
                    {settings.hasApiKey ? (
                      <>
                        <span className="px-3 py-1 bg-[#7dde4f] bg-opacity-20 text-[#7dde4f] text-sm font-medium rounded-full">
                          ✓ Configured
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">({settings.openaiApiKey})</span>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-full">
                        ✗ Not Configured
                      </span>
                    )}
                  </div>
                </div>

                {/* API Key Input */}
                <div>
                  <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    OpenAI API Key {!settings.hasApiKey && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="openaiKey"
                      type={showKey ? 'text' : 'password'}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder={settings.hasApiKey ? 'Enter new key to update' : 'sk-...'}
                      className="w-full px-4 py-2 pr-12 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      {showKey ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to keep the current key. Enter a new key to update it.
                  </p>
                </div>

                {/* Model Selection */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    OpenAI Model
                  </label>
                  <select
                    id="model"
                    value={settings.openaiModel}
                    onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                {/* Max Tokens */}
                <div>
                  <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Tokens: <span className="text-[#7dde4f]">{settings.maxTokens}</span>
                  </label>
                  <input
                    id="maxTokens"
                    type="range"
                    min="100"
                    max="4000"
                    step="100"
                    value={settings.maxTokens}
                    onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                    className="w-full accent-[#7dde4f]"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>100</span>
                    <span>4000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Configuration */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-[#7dde4f] dark:hover:border-[#7dde4f] transition-all">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-[#7dde4f]" />
                System Configuration
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Manage system-wide settings and user access
              </p>

              <div className="space-y-4">
                {/* System Email */}
                <div>
                  <label htmlFor="systemEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    System Email
                  </label>
                  <input
                    id="systemEmail"
                    type="email"
                    value={settings.systemEmail || ''}
                    onChange={(e) => setSettings({ ...settings, systemEmail: e.target.value })}
                    placeholder="admin@prorise.ai"
                    className="w-full px-4 py-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#7dde4f]"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email address for system notifications and support
                  </p>
                </div>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                  <div>
                    <label htmlFor="maintenanceMode" className="block font-medium text-gray-900 dark:text-white mb-1">
                      Maintenance Mode
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Temporarily disable the service for all users
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Allow Registration */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                  <div>
                    <label htmlFor="allowRegistration" className="block font-medium text-gray-900 dark:text-white mb-1">
                      Allow New Registrations
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable or disable new user registrations
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.allowRegistration ? 'bg-[#7dde4f]' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.allowRegistration ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-[#7dde4f] text-black font-semibold rounded-lg hover:bg-[#5ab836] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </>
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

  // Return default settings - will be fetched client-side
  return {
    props: {
      initialSettings: {
        openaiApiKey: null,
        hasApiKey: false,
        openaiModel: 'gpt-4o-mini',
        maxTokens: 500,
        systemEmail: null,
        maintenanceMode: false,
        allowRegistration: true,
      },
    },
  };
};
