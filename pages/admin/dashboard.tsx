import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemStats, useAllClinics, useActivityFeed, useSubscriptionStatus } from '../../lib/real-time-hooks';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface SystemStats {
  totalClinics: number;
  totalPatients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingInsuranceClaims: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface Clinic {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'suspended';
  location: string;
  specialties: string[];
  patientCount: number;
  subscriptionStatus: 'active' | 'expired';
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  activeSubscribers: number;
  status: 'active' | 'inactive';
}

// Helper hook to get patient counts for all clinics
function usePatientCountsByClinic() {
  const [counts, setCounts] = useState<{ [clinicId: string]: number }>({});
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const newCounts: { [clinicId: string]: number } = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const clinicId = data.clinicId;
        if (clinicId) {
          newCounts[clinicId] = (newCounts[clinicId] || 0) + 1;
        }
      });
      setCounts(newCounts);
    });
    return () => unsubscribe();
  }, []);
  return counts;
}

export default function AdminDashboard() {
  const { user, loading, userData, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Real-time system stats
  const { stats: systemStats, loading: statsLoading, error: statsError } = useSystemStats();
  // Real-time clinics list
  const { clinics, loading: clinicsLoading, error: clinicsError } = useAllClinics();
  // Real-time activity feed (latest 10, can load more)
  const [activityLimit, setActivityLimit] = useState(10);
  const { activities, loading: activityLoading, error: activityError } = useActivityFeed(undefined, activityLimit);
  // Real-time subscriptions (for plan stats)
  const { subscriptions, loading: subsLoading, error: subsError } = useSubscriptionStatus();

  const patientCounts = usePatientCountsByClinic();

  const navigationItems = [
    { name: 'ダッシュボード', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'クリニック', href: '/admin/clinics', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: '患者', href: '/admin/patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'サブスクリプションプラン', href: '/admin/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: '保険請求', href: '/admin/insurance-claims', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to home
      router.push('/');
    }
  };

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      router.replace('/auth/admin/login');
    }
  }, [user, loading, userData, router]);

  if (loading || !user || userData?.role !== 'admin') {
    return <div>Loading...</div>;
  }

  // Aggregate commission and admin revenue
  const totalClinicCommission = subsLoading ? 0 : subscriptions.reduce((sum, s) => sum + (s.clinicCommission || 0), 0);
  const totalAdminRevenue = subsLoading ? 0 : subscriptions.reduce((sum, s) => sum + (s.adminRevenue || 0), 0);

  // Mapping functions for Japanese display
  const displayStatus = (status: string) => {
    if (status === 'pending') return '保留中';
    if (status === 'active') return '有効';
    if (status === 'unpaid') return '未払い';
    if (status === 'suspended') return '停止中';
    return status;
  };

  // Mapping for activity types to Japanese and UI details
  const activityTypeMap: { [key: string]: { label: string; color: string; icon: JSX.Element } } = {
    new_signup: {
      label: '新規登録',
      color: 'bg-blue-100 text-blue-800',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      ),
    },
    payment_success: {
      label: '支払い成功',
      color: 'bg-green-100 text-green-800',
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ),
    },
    payment_failed: {
      label: '支払い失敗',
      color: 'bg-red-100 text-red-800',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      ),
    },
    base_fee_paid: {
      label: '基本料金支払い',
      color: 'bg-yellow-100 text-yellow-800',
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
      ),
    },
    // 他のタイプもここに追加できます
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-100">
        {/* Top Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800">管理者ダッシュボード</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
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
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${router.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <svg
                      className={`mr-3 h-6 w-6 ${router.pathname === item.href
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
              {/* System Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">クリニック総数</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : systemStats.totalClinics}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">患者総数</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : systemStats.totalPatients}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">有効サブスクリプション</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : systemStats.activeSubscriptions}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New: Total Clinic Commission */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">クリニック手数料合計</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-green-700">¥{totalClinicCommission.toLocaleString()}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New: Total Admin Revenue */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">管理者収益合計</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-blue-700">¥{totalAdminRevenue.toLocaleString()}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinics Overview */}
              <div className="mt-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">クリニック概要</h2>
                </div>
                <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クリニック名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">基本料金</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clinicsLoading ? (
                        <tr><td colSpan={6} className="text-center py-4">読み込み中...</td></tr>
                      ) : clinics.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-4">クリニックが見つかりません。</td></tr>
                      ) : clinics.map((clinic) => (
                        <tr key={clinic.clinicId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{clinic.clinicName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clinic.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              displayStatus(clinic.baseFeeStatus) === '有効' ? 'bg-green-100 text-green-800' :
                              displayStatus(clinic.baseFeeStatus) === '未払い' ? 'bg-yellow-100 text-yellow-800' :
                              displayStatus(clinic.baseFeeStatus) === '保留中' ? 'bg-red-100 text-red-800' :
                              displayStatus(clinic.baseFeeStatus) === '停止中' ? 'bg-gray-300 text-gray-700' :
                              'bg-gray-200 text-gray-500'
                            }`}>{displayStatus(clinic.baseFeeStatus)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patientCounts[clinic.clinicId] || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{displayStatus(clinic.baseFeeStatus)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => router.push(`/admin/clinics/${clinic.clinicId}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              詳細を見る
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time Activity Feed */}
              <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-800 mt-8 mb-4">最新のアクティビティ</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {activityLoading ? (
                      <li className="py-4 text-center">読み込み中...</li>
                    ) : activities.length === 0 ? (
                      <li className="py-4 text-center">最近のアクティビティはありません。</li>
                    ) : activities.map((activity, idx) => {
                      let activityDate = '';
                      if (activity.timestamp) {
                        if (typeof activity.timestamp === 'string') {
                          // Try to parse string date
                          const d = new Date(activity.timestamp);
                          activityDate = isNaN(d.getTime()) ? '' : d.toLocaleString();
                        } else if (activity.timestamp.toDate) {
                          // Firestore Timestamp
                          activityDate = activity.timestamp.toDate().toLocaleString();
                        }
                      }
                      const typeInfo = activityTypeMap[activity.type] || {
                        label: activity.type,
                        color: 'bg-gray-100 text-gray-800',
                        icon: (
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                        ),
                      };
                      return (
                        <li key={activity.activityId} className="flex items-center px-4 py-3 my-1 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                          <div className="flex-shrink-0 mr-3">
                            {typeInfo.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-2 align-middle ${typeInfo.color}`}>{typeInfo.label}</span>
                            <span className="align-middle text-gray-700 text-sm">{activity.message}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0 text-xs text-gray-400 text-right min-w-[110px]">{activityDate}</div>
                        </li>
                      );
                    })}
                  </ul>
                  {/* Show More button */}
                  {activities.length === activityLimit && !activityLoading && (
                    <div className="flex justify-center py-4">
                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold"
                        onClick={() => setActivityLimit(l => l + 10)}
                      >
                        もっと見る
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 