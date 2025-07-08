import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaClinicMedical, FaUserMd, FaUser, FaCrown, FaRegStar, FaMedal, FaCheckCircle } from 'react-icons/fa';
import { Plan } from '../lib/plans';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalPlan, setModalPlan] = useState<Plan | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

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

  // Fetch subscription plans from Firestore
  useEffect(() => {
    if (!db) return;
    setPlansLoading(true);
    const unsub = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Plan[]);
      setPlansLoading(false);
    });
    return () => unsub();
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 bg-gradient-to-r from-blue-100 via-white to-blue-50 shadow-md border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <span className="text-3xl text-blue-600 drop-shadow"><FaClinicMedical /></span>
              <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">ヘルスサポートシステム</h1>
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
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-10 max-w-2xl mx-auto mb-8 border border-blue-100">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-900 mb-4 drop-shadow-lg">ようこそ、<span className="text-blue-600">ヘルスサポート</span>の世界へ</h2>
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
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h3 className="text-3xl font-bold text-center mb-10 text-blue-900">プランを選択してください</h3>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative p-8 bg-white border rounded-2xl shadow-lg flex flex-col transition-transform transform hover:scale-105 cursor-pointer ${plan.name === 'プレミアム' ? 'bg-gradient-to-br from-yellow-50 to-white' : ''}`}
            >
              {/* Badge for popular plan */}
              {idx === 2 && (
                <span className="absolute top-4 right-4 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow"><FaCrown className="inline mr-1" />人気</span>
              )}
              <div className="flex items-center gap-2 mb-2">
                {idx === 0 && <FaRegStar className="text-blue-400" />}
                {idx === 1 && <FaMedal className="text-green-400" />}
                {idx === 2 && <FaCrown className="text-yellow-400" />}
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
              </div>
              <p className="mt-2 text-gray-500 min-h-[48px]">{plan.description}</p>
              <div className="mt-6">
                <p className="text-4xl font-extrabold text-blue-900">¥{plan.price.toLocaleString()}<span className="text-lg font-medium text-gray-500">/月</span></p>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-600">料金内訳:</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center gap-2">
                    <FaClinicMedical className="text-green-500" />
                    <span className="text-sm text-gray-700">クリニック受取: ¥{plan.commission.toLocaleString()}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCrown className="text-purple-500" />
                    <span className="text-sm text-gray-700">会社受取: ¥{plan.companyCut.toLocaleString()}</span>
                  </li>
                </ul>
              </div>
              <ul role="list" className="mt-6 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-blue-700">
                    <FaCheckCircle className="text-green-400" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className="mt-6 w-full bg-blue-600 border border-transparent rounded-md shadow-lg py-3 px-4 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
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
      <footer className="w-full py-4 text-center text-gray-400 text-xs border-t bg-gradient-to-r from-blue-50 to-white mt-8">
        &copy; {new Date().getFullYear()} Health Science SaaS. All rights reserved.
      </footer>
    </div>
  );
} 