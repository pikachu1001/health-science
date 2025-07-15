import { ReactNode, useState,useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useClinicStats } from '../lib/real-time-hooks';
import { useActivityFeed } from '../lib/real-time-hooks';
import { updateDoc, arrayUnion, doc as firestoreDoc, getFirestore } from 'firebase/firestore';

interface ClinicLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { name: 'ダッシュボード', href: '/clinic/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: '患者管理', href: '/clinic/patients', icon: 'M5 13l4 4L19 7' },
  { name: '報酬・請求', href: '/clinic/billing', icon: 'M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z' },
  { name: '設定', href: '/clinic/settings', icon: 'M12 6v6l4 2' },
];

export default function ClinicLayout({ children }: ClinicLayoutProps) {
  const router = useRouter();
  const { user, userData,loading, logout } = useAuth();
  const [payingBaseFee, setPayingBaseFee] = useState(false);
  const [baseFeeError, setBaseFeeError] = useState('');
  const clinicId = user?.uid || '';
  const { stats: clinicStats } = useClinicStats(clinicId);
  const { activities } = useActivityFeed(clinicId, 5);
  const [notification, setNotification] = useState<string | null>(null);

  // Show notification for new patient or subscription only if not already displayed for this clinic
  useEffect(() => {
    if (!activities || activities.length === 0) return;
    const latest = activities[0];
    // Only show if not already displayed for this clinic
    if (
      (latest.type === 'new_signup' || latest.type === 'payment_success') &&
      latest.activityId &&
      (!(latest as any).displayedFor || !(latest as any).displayedFor.includes(clinicId))
    ) {
      setNotification(latest.message);
      // Mark as displayed in Firestore
      const db = getFirestore();
      const activityRef = firestoreDoc(db, 'activity_feed', latest.activityId);
      updateDoc(activityRef, {
        displayedFor: arrayUnion(clinicId)
      });
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [activities, clinicId]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/clinic/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

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
      router.push('/auth/clinic/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/clinic/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-green-50">
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <span className="font-bold">お知らせ:</span> {notification}
        </div>
      )}
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
            {/* Only show the base fee button if not active */}
            {clinicStats?.baseFeeStatus !== 'active' && (
              <button
                onClick={handlePayBaseFee}
                disabled={payingBaseFee}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-green-700 text-white shadow hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition disabled:opacity-50"
              >
                {payingBaseFee ? '処理中...' : '基本料金を支払う'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white shadow hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
              ログアウト
            </button>
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
          {children}
        </main>
      </div>
    </div>
  );
} 