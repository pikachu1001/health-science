import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaClinicMedical, FaUserMd, FaUser } from 'react-icons/fa';
import { plans, Plan } from '../lib/plans';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalPlan, setModalPlan] = useState<Plan | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Reopen modal after login if plan was stored
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPlanId = localStorage.getItem('pendingPlanId');
      if (storedPlanId && plans) {
        const plan = plans.find(p => p.id === storedPlanId);
        if (plan) {
          setModalPlan(plan);
          setShowModal(true);
          localStorage.removeItem('pendingPlanId');
        }
      }
    }
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setModalPlan(plan);
    setShowModal(true);
  };

  const handleSubscriptionConfirm = async () => {
    if (!user || userData?.role !== 'patient') {
      // Store plan id and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingPlanId', modalPlan?.id || '');
      }
      router.push('/auth/patient/login?returnTo=/');
      return;
    }
    if (!modalPlan || !userData?.email) return;
    setIsPaying(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: modalPlan.priceId,
          email: userData.email,
          userId: user.uid
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Stripe Checkoutの作成に失敗しました: ' + (data.error || '不明なエラー'));
      }
    } catch (err) {
      alert('Stripe Checkoutへのリダイレクト中にエラーが発生しました。');
    } finally {
      setIsPaying(false);
      setShowModal(false);
    }
  };

  const handlePatientLogin = () => {
    if (user && userData?.role === 'patient') {
      router.push('/patient/dashboard');
    } else {
      router.push('/auth/patient/login');
    }
  };

  const handleClinicLogin = () => {
    if (user && userData?.role === 'clinic') {
      router.push('/clinic/dashboard');
    } else {
      router.push('/auth/clinic/login');
    }
  };

  const handleAdminLogin = () => {
    if (user && userData?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/auth/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/80 shadow-sm backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <span className="text-2xl text-blue-600"><FaClinicMedical /></span>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">ヘルスサポートシステム</h1>
            </div>
            <div>
              <button
                onClick={handleAdminLogin}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-md"
              >
                <FaUserMd className="mr-2" /> 管理者ログイン
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center py-16 px-4 bg-gradient-to-br from-blue-100/60 to-purple-100/60">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 drop-shadow-lg">ようこそ、<span className="text-blue-600">ヘルスサポート</span>の世界へ</h2>
        <p className="mt-2 text-lg sm:text-2xl text-gray-600 max-w-2xl mx-auto mb-8">健康とウェルネスの信頼できるパートナー。患者様、クリニック、管理者のためのスマートなサブスクリプション管理。</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <button
            onClick={handlePatientLogin}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-semibold rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg transition"
          >
            <FaUser className="mr-2" /> 患者ログイン
          </button>
          <button
            onClick={handleClinicLogin}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-semibold rounded-md text-white bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 shadow-lg transition"
          >
            <FaClinicMedical className="mr-2" /> クリニックログイン
          </button>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h3 className="text-3xl font-bold text-center mb-10 text-gray-800">プランを選択してください</h3>
        <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col transition-transform transform hover:scale-105 cursor-pointer border-gray-200"
            >
              <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-4 text-gray-500">{plan.description}</p>
              <div className="mt-6">
                <p className="text-4xl font-extrabold text-gray-900">¥{plan.price.toLocaleString()}<span className="text-lg font-medium text-gray-500">/月</span></p>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-600">料金内訳:</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 text-green-500">クリニック受取: ¥{plan.commission.toLocaleString()}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 text-purple-500">会社受取: ¥{plan.companyCut.toLocaleString()}</span>
                  </li>
                </ul>
              </div>
              <button
                className="mt-6 w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => handleSelectPlan(plan)}
              >
                このプランを選択
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {showModal && modalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-200 focus:outline-none" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none"
              aria-label="閉じる"
              onClick={() => setShowModal(false)}
              disabled={isPaying}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 id="modal-title" className="text-2xl font-bold mb-2 text-blue-700 text-center">{modalPlan.name}</h2>
            <p className="mb-4 text-center text-gray-700">{modalPlan.description}</p>
            <div className="mb-4 bg-blue-50 rounded-lg p-4 flex flex-col items-center">
              <span className="text-3xl font-extrabold text-blue-800 mb-1">¥{modalPlan.price.toLocaleString()}<span className="text-lg font-medium text-gray-500">/月</span></span>
              <div className="flex space-x-4 mt-2">
                <span className="flex items-center text-green-700 font-semibold"><svg className="h-5 w-5 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>クリニック報酬: ¥{modalPlan.commission.toLocaleString()}</span>
                <span className="flex items-center text-purple-700 font-semibold"><svg className="h-5 w-5 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>会社手数料: ¥{modalPlan.companyCut.toLocaleString()}</span>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-600 mb-2">プランの特徴:</p>
              <ul className="space-y-2">
                {modalPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-700"><svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold focus:outline-none"
                onClick={() => setShowModal(false)}
                disabled={isPaying}
              >
                キャンセル
              </button>
              <button
                className="px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                onClick={handleSubscriptionConfirm}
                disabled={isPaying}
                autoFocus
              >
                {isPaying ? '処理中...' : 'サブスクリプション選択'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white/80 text-center text-gray-500 text-sm shadow-inner">
        &copy; {new Date().getFullYear()} ヘルスサポートシステム. All rights reserved.
      </footer>
    </div>
  );
} 