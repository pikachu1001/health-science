import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useClinicPatients, 
  useClinicDashboardStats, 
  useClinicActivityLog,
  useSubscriptionStatus,
  useClinicData
} from '../../lib/real-time-hooks';
import { FaInfoCircle } from 'react-icons/fa';

export default function ClinicDashboard() {
  const router = useRouter();
  const { user, userData, loading, logout } = useAuth();
  const [payingBaseFee, setPayingBaseFee] = useState(false);
  const [baseFeeError, setBaseFeeError] = useState('');

  // Use real-time hooks
  const clinicId = user?.uid || '';
  const { patients, loading: patientsLoading } = useClinicPatients(clinicId, 5);
  const { stats, loading: statsLoading } = useClinicDashboardStats(clinicId);
  const { activities, loading: activitiesLoading } = useClinicActivityLog(clinicId, 10);
  const { subscriptions, loading: subsLoading } = useSubscriptionStatus(clinicId);
  const { clinicData } = useClinicData(clinicId);

  const navigationItems = [
    { name: 'ダッシュボード', href: '/clinic/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'サブスクリプション', href: '/clinic/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const handlePayBaseFee = async () => {
    if (!user || !userData?.email) {
      setBaseFeeError('ログイン情報が見つかりません。再度ログインしてください。');
      return;
    }
    setPayingBaseFee(true);
    setBaseFeeError('');
    try {
      const res = await fetch('/api/stripe/create-clinic-base-fee-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, userId: user.uid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBaseFeeError(data.error || 'Stripe Checkoutの作成に失敗しました。');
      }
    } catch (err) {
      setBaseFeeError('Stripe Checkoutへのリダイレクト中にエラーが発生しました。');
    } finally {
      setPayingBaseFee(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/clinic/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  // Aggregate commission for this clinic
  const totalClinicCommission = subsLoading ? 0 : subscriptions.reduce((sum, s) => sum + ((s as any).clinicCommission || 0), 0);

  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-green-50">
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-green-500 to-blue-600 shadow-lg rounded-b-2xl mb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow text-green-600 text-2xl font-extrabold mr-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                </span>
                <h1 className="text-2xl font-extrabold text-white tracking-wide drop-shadow">クリニックダッシュボード</h1>
              </div>
              <div className="flex items-center space-x-4">
              <button
                onClick={handlePayBaseFee}
                disabled={payingBaseFee}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-green-700 text-white shadow hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition disabled:opacity-50"
              >
                {payingBaseFee ? '処理中...' : '基本料金を支払う'}
              </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white shadow hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar Navigation */}
          <aside className="w-64 min-h-screen bg-gradient-to-b from-green-100 to-blue-50 shadow-xl rounded-r-2xl flex flex-col py-6 px-2">
            <nav className="flex-1">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-base font-semibold rounded-xl transition-all duration-150 ${router.pathname === item.href
                      ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white shadow-lg'
                      : 'text-green-700 hover:bg-green-200 hover:text-green-900'
                      }`}
                  >
                    <svg
                      className={`mr-3 h-6 w-6 ${router.pathname === item.href
                        ? 'text-white'
                        : 'text-green-400 group-hover:text-green-600'
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
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Patients */}
              <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-green-400 hover:shadow-lg transition relative">
                <div className="absolute top-2 right-2 text-green-400" title="登録されている患者の総数"><FaInfoCircle /></div>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-green-600 truncate flex items-center gap-1">総患者数</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statsLoading ? '...' : stats.totalPatients}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              {/* Total Revenue */}
              <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-yellow-400 hover:shadow-lg transition relative">
                <div className="absolute top-2 right-2 text-yellow-400" title="今月の総収益"><FaInfoCircle /></div>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-yellow-600 truncate flex items-center gap-1">総収益</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {statsLoading ? '...' : formatCurrency(stats.revenueThisMonth)}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              {/* Clinic Commission */}
              <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-purple-400 hover:shadow-lg transition relative">
                <div className="absolute top-2 right-2 text-purple-400" title="クリニックが得た手数料の合計"><FaInfoCircle /></div>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-purple-600 truncate flex items-center gap-1">クリニック手数料</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {subsLoading ? '...' : formatCurrency(totalClinicCommission)}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-700">サブスクリプション状況</span>
                  <FaInfoCircle className="text-green-400" title="現在のサブスクリプションプランと状態" />
                </div>
                {subsLoading ? (
                  <div>読み込み中...</div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-gray-500">サブスクリプションがありません。</div>
                ) : (
                  subscriptions.map((sub, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 border-b last:border-b-0 py-2">
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">{sub.planSnapshot?.name || sub.planId}</span>
                      <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs">{sub.status}</span>
                      <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">{sub.startDate ? new Date(sub.startDate.seconds * 1000).toLocaleDateString('ja-JP') : '-'}</span>
                      <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{sub.endDate ? new Date(sub.endDate.seconds * 1000).toLocaleDateString('ja-JP') : '継続中'}</span>
                    </div>
                  ))
                )}
                <div className="mt-2">
                  <Link href="/clinic/subscriptions" className="text-blue-500 hover:underline text-sm font-bold">サブスクリプション管理 &rarr;</Link>
                </div>
              </div>
              {/* Base Fee Status */}
              <div className="bg-white shadow rounded-lg p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-700">基本料金ステータス</span>
                  <FaInfoCircle className="text-yellow-400" title="クリニックの基本料金支払い状況" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold">{clinicData?.baseFeeStatus || '不明'}</span>
                  <button
                    onClick={handlePayBaseFee}
                    disabled={payingBaseFee}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-semibold rounded bg-gradient-to-r from-green-400 to-green-600 text-white shadow hover:from-green-500 hover:to-green-700 transition disabled:opacity-50"
                  >
                    {payingBaseFee ? '処理中...' : '基本料金を支払う'}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Patients */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Patients */}
              <div className="bg-white shadow rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-green-700 flex items-center gap-2 text-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    最近の患者
                  </span>
                  <Link href="/clinic/patients" className="text-green-600 hover:text-green-800 hover:underline text-sm font-bold transition">すべて表示 &rarr;</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm rounded-xl">
                    <thead>
                      <tr className="bg-gradient-to-r from-green-50 to-blue-50 text-green-700">
                        <th className="px-4 py-2 text-left font-semibold">名前</th>
                        <th className="px-4 py-2 text-left font-semibold">保険会社</th>
                        <th className="px-4 py-2 text-left font-semibold">プラン</th>
                        <th className="px-4 py-2 text-center font-semibold">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientsLoading ? (
                        <tr><td colSpan={4} className="text-center py-6 text-gray-400">読み込み中...</td></tr>
                      ) : patients.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-6"><span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-500">患者がいません。</span></td></tr>
                      ) : (
                        patients.map((p, idx) => (
                          <tr key={idx} className="hover:bg-green-50 transition">
                            <td className="px-4 py-2 font-medium text-green-900">{p.name}</td>
                            <td className="px-4 py-2 text-blue-700">{p.insuranceProvider}</td>
                            <td className="px-4 py-2">{p.subscriptionPlan || <span className='inline-block px-2 py-1 rounded bg-gray-100 text-gray-400 text-xs'>未登録</span>}</td>
                            <td className="px-4 py-2 text-center">
                              <Link href={`/clinic/patients`} className="text-green-500 hover:text-green-700 hover:underline font-bold text-xs">詳細</Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                アクティビティログ
              </h2>
              <div className="bg-white shadow rounded-lg p-4 divide-y divide-gray-100">
                {activitiesLoading ? (
                  <div>読み込み中....</div>
                ) : activities.length === 0 ? (
                  <div className="text-gray-500">アクティビティがありません。</div>
                ) : (
                  activities.map((activity, idx) => (
                    <div key={idx} className="py-3 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                      </span>
                      <div>
                        <div className="font-medium text-gray-800">{activity.description}</div>
                        <div className="text-xs text-gray-400">{activity.timestamp && activity.timestamp.toLocaleString('ja-JP')}</div>
                      </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
} 
