import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import { plans, Plan } from '../../lib/plans';
import { useAuth } from '../../contexts/AuthContext';
import { FaCheckCircle } from 'react-icons/fa';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/patient/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const handleSelectPlan = (plan: Plan) => {
    if (!user || userData?.role !== 'patient') {
      router.push('/auth/patient/login');
      return;
    }
    setSelectedPlan(plan);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan || !user || !userData?.email) return;

    setIsLoading(true);
    try {
      // Call the API route to create a Stripe Checkout Session
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

  return (
    <DashboardLayout allowedRoles={['patient']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              サブスクリプションプラン
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              あなたに最適なプランを選択してください。
            </p>
          </div>

          <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col transition-transform transform hover:scale-105 cursor-pointer ${
                  selectedPlan?.id === plan.id ? 'border-blue-500 border-2' : 'border-gray-200'
                }`}
                onClick={() => handleSelectPlan(plan)}
              >
                {selectedPlan?.id === plan.id && (
                  <div className="absolute top-4 right-4 text-blue-500">
                    <FaCheckCircle size={24} />
                  </div>
                )}
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-gray-500">{plan.description}</p>
                <div className="mt-6">
                  <p className="text-4xl font-extrabold text-gray-900">¥{plan.price.toLocaleString()}<span className="text-lg font-medium text-gray-500">/月</span></p>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600">料金内訳:</p>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start">
                      <span className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="ml-3 text-sm text-gray-700">クリニックへの報酬: ¥{plan.commission.toLocaleString()}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0">
                        <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="ml-3 text-sm text-gray-700">システム手数料: ¥{plan.companyCut.toLocaleString()}</span>
                    </li>
                  </ul>
                </div>
                <ul role="list" className="mt-6 space-y-4 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
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
                className="w-full max-w-md mx-auto bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? '処理中...' : `${selectedPlan.name}に登録する`}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 