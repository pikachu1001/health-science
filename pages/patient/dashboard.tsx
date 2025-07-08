import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { plans, Plan } from '../../lib/plans';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FaUser, FaSignOutAlt, FaHospital, FaCheckCircle, FaRegStar, FaCrown, FaMedal } from 'react-icons/fa';

export default function PatientDashboard() {
  const router = useRouter();
  const { user, userData, loading, logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('loading...');
  const [clinicName, setClinicName] = useState<string>('loading...');


  // Real-time subscription status
  useEffect(() => {
    if (!user || !db) return;

    // Query subscriptions where patientId == user.uid
    const q = query(
      collection(db, 'subscriptions'),
      where('patientId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        // Assuming one active subscription per patient
        const subData = querySnapshot.docs[0].data();
        setSubscriptionStatus(subData.status || '不明');
        if (subData.clinicId && db) {
          getDoc(doc(db, 'clinics', subData.clinicId)).then(clinicSnap => {
            setClinicName(clinicSnap.exists() ? clinicSnap.data().clinicName : '未登録');
          });
        } else {
          setClinicName('未登録');
        }
      } else {
        setSubscriptionStatus('未登録');
        setClinicName('未登録');
      }
    });

    return () => unsub();
  }, [user, db]);

  useEffect(() => {
    if (router.query.success === 'true') {
      setSubscriptionMessage('サブスクリプションが正常に完了しました！');
    } else if (router.query.canceled === 'true') {
      setSubscriptionMessage('サブスクリプションがキャンセルされました。');
    }
  }, [router.query]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      router.push('/');
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan || !user || !userData?.email) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
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
      setIsLoading(false);
    }
  };

  // Helper function to translate status
  const translateStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'アクティブ';
      case 'inactive':
        return '非アクティブ';
      case 'canceled':
        return 'キャンセル済み';
      case 'trialing':
        return 'トライアル中';
      case 'past_due':
        return '支払い遅延';
      case 'unpaid':
        return '未払い';
      case '未登録':
        return '未登録';
      case '不明':
        return '不明';
      default:
        return status;
    }
  };

  // Helper function to translate status and get badge color
  const statusInfo = (status: string) => {
    switch (status) {
      case 'アクティブ':
        return { label: 'アクティブ', color: 'bg-green-100 text-green-800 border-green-300' };
      case '非アクティブ':
        return { label: '非アクティブ', color: 'bg-gray-100 text-gray-800 border-gray-300' };
      case 'キャンセル済み':
        return { label: 'キャンセル済み', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'トライアル中':
        return { label: 'トライアル中', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case '支払い遅延':
        return { label: '支払い遅延', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case '未払い':
        return { label: '未払い', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      case '未登録':
        return { label: '未登録', color: 'bg-gray-100 text-gray-800 border-gray-300' };
      case '不明':
        return { label: '不明', color: 'bg-gray-100 text-gray-800 border-gray-300' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  // Determine if user is subscribed
  const isSubscribed = subscriptionStatus === 'アクティブ' || subscriptionStatus === 'トライアル中';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-blue-100 via-white to-blue-50 shadow-md px-4 py-4 flex justify-between items-center border-b border-blue-200">
        <div className="flex items-center gap-6">
          <span className="font-bold text-2xl text-blue-900 tracking-tight">患者ダッシュボード</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${statusInfo(translateStatus(subscriptionStatus)).color}`} title="サブスクリプション状況">
            <FaCheckCircle className="mr-1" />
            {statusInfo(translateStatus(subscriptionStatus)).label}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-800 text-sm font-semibold" title="クリニック">
            <FaHospital className="mr-1" />
            {clinicName}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/patient/profile')}
            className="px-4 py-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium flex items-center gap-2 shadow-sm"
          >
            <FaUser /> プロフィール
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2 shadow-sm"
          >
            <FaSignOutAlt /> ログアウト
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Subscription Message */}
        {subscriptionMessage && (
          <div className={`mb-6 text-center py-3 px-4 rounded-md font-semibold ${router.query.success === 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{subscriptionMessage}</div>
        )}

        {/* If subscribed, show summary. Else, show plan selection */}
        {isSubscribed ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-blue-100 max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-2 mb-4">
              <FaCrown className="text-yellow-400 text-3xl" />
              <h2 className="text-2xl font-bold text-blue-900">ご利用中のプラン</h2>
            </div>
            <div className="text-lg text-gray-700 mb-2">サブスクリプション状況: <span className={`font-bold ${statusInfo(translateStatus(subscriptionStatus)).color}`}>{statusInfo(translateStatus(subscriptionStatus)).label}</span></div>
            <div className="text-lg text-gray-700 mb-2">クリニック: <span className="font-bold text-blue-800">{clinicName}</span></div>
            {/* Optionally, show more details about the plan here */}
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-blue-900 sm:text-5xl drop-shadow">サブスクリプションプラン</h1>
              <p className="mt-4 text-xl text-blue-600">あなたに最適なプランを選択してください。</p>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`relative p-8 bg-white border rounded-2xl shadow-lg flex flex-col transition-transform transform hover:scale-105 cursor-pointer ${selectedPlan?.id === plan.id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'} ${plan.name === 'プレミアム' ? 'bg-gradient-to-br from-yellow-50 to-white' : ''}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {selectedPlan?.id === plan.id && (
                    <div className="absolute top-4 right-4 text-blue-500">
                      <FaCheckCircle size={24} />
                    </div>
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
                        <FaHospital className="text-green-500" />
                        <span className="text-sm text-gray-700">クリニックへの報酬: ¥{plan.commission.toLocaleString()}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FaCrown className="text-purple-500" />
                        <span className="text-sm text-gray-700">システム手数料: ¥{plan.companyCut.toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>
                  <ul role="list" className="mt-6 space-y-4 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={feature} className="flex items-center gap-2 text-blue-700">
                        <FaCheckCircle className="text-green-400" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {selectedPlan && (
              <div className="mt-10 text-center">
                <button
                  onClick={handleConfirmSubscription}
                  disabled={isLoading}
                  className="w-full max-w-md mx-auto bg-blue-600 border border-transparent rounded-md shadow-lg py-3 px-4 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                >
                  {isLoading ? '処理中...' : `${selectedPlan.name}に登録する`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
      {/* Footer */}
      <footer className="w-full py-4 text-center text-gray-400 text-xs border-t bg-gradient-to-r from-blue-50 to-white mt-8">
        &copy; {new Date().getFullYear()} Health Science SaaS. All rights reserved.
      </footer>
    </div>
  );
} 