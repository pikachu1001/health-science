import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: string | number | boolean;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [settings] = useState<SystemSetting[]>([
    {
      id: '1',
      category: 'general',
      name: 'システム名',
      value: 'ヘルスサポートシステム',
      description: '画面に表示されるシステム名',
      type: 'text',
    },
    {
      id: '2',
      category: 'general',
      name: 'システムメールアドレス',
      value: 'support@healthsystem.com',
      description: 'システム通知の連絡先メールアドレス',
      type: 'text',
    },
    {
      id: '3',
      category: 'general',
      name: 'メンテナンスモード',
      value: false,
      description: 'メンテナンスモードを有効にしてシステムへのアクセスを制限',
      type: 'boolean',
    },
    {
      id: '4',
      category: 'security',
      name: 'パスワード有効期限（日）',
      value: 90,
      description: 'パスワードの有効期限（日数）',
      type: 'number',
    },
    {
      id: '5',
      category: 'security',
      name: '最大ログイン試行回数',
      value: 5,
      description: 'アカウントロックまでの最大ログイン失敗回数',
      type: 'number',
    },
    {
      id: '6',
      category: 'security',
      name: '二要素認証',
      value: true,
      description: '管理者アカウントの二要素認証を有効にする',
      type: 'boolean',
    },
    {
      id: '7',
      category: 'notifications',
      name: 'メール通知',
      value: true,
      description: 'システムイベントのメール通知を有効にする',
      type: 'boolean',
    },
    {
      id: '8',
      category: 'notifications',
      name: '通知タイプ',
      value: 'all',
      description: '送信する通知の種類',
      type: 'select',
      options: ['すべて', '重要', 'なし'],
    },
    {
      id: '9',
      category: 'billing',
      name: '通貨',
      value: 'JPY',
      description: '請求時のデフォルト通貨',
      type: 'select',
      options: ['JPY', 'USD', 'EUR'],
    },
    {
      id: '10',
      category: 'billing',
      name: '税率',
      value: 10,
      description: '請求時のデフォルト税率（％）',
      type: 'number',
    },
  ]);

  const navigationItems = [
    { name: 'ダッシュボード', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'クリニック', href: '/admin/clinics', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: '患者', href: '/admin/patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'サブスクリプションプラン', href: '/admin/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: '保険請求', href: '/admin/insurance-claims', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'システム設定', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const categories = [
    { id: 'general', name: '一般設定' },
    { id: 'security', name: 'セキュリティ設定' },
    { id: 'notifications', name: '通知設定' },
    { id: 'billing', name: '請求設定' },
  ];

  const filteredSettings = settings.filter(setting => setting.category === activeTab);

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={setting.value as string}
            onChange={() => {/* TODO: Implement setting update */}}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={setting.value as number}
            onChange={() => {/* TODO: Implement setting update */}}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        );
      case 'boolean':
        return (
          <button
            onClick={() => {/* TODO: Implement setting update */}}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              setting.value ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                setting.value ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        );
      case 'select':
        return (
          <select
            value={setting.value as string}
            onChange={() => {/* TODO: Implement setting update */}}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {setting.options?.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">システム設定</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  sessionStorage.removeItem('adminData');
                  router.push('/');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-sm h-screen">
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    router.pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg
                    className={`mr-3 h-6 w-6 ${
                      router.pathname === item.href
                        ? 'text-gray-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Settings Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`${
                      activeTab === category.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Form */}
            <div className="mt-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-6">
                    {filteredSettings.map((setting) => (
                      <div key={setting.id} className="grid grid-cols-3 gap-6">
                        <div className="col-span-1">
                          <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700">
                            {setting.name}
                          </label>
                          <p className="mt-1 text-sm text-gray-500">{setting.description}</p>
                        </div>
                        <div className="col-span-2">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    onClick={() => {/* TODO: Implement save settings */}}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 