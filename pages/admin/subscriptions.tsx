import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  activeSubscribers: number;
  status: 'active' | 'inactive';
  description: string;
  billingCycle: 'monthly' | 'yearly';
  maxAppointments: number;
  maxPrescriptions: number;
  maxLabTests: number;
}

export default function SubscriptionsPage() {
  const { user, loading, userData, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState<any>({
    id: '', name: '', price: '', priceId: '', features: '', status: 'active', description: '', billingCycle: 'monthly', maxAppointments: '', maxPrescriptions: '', maxLabTests: '', activeSubscribers: 0
  });

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      router.replace('/auth/admin/login');
    }
  }, [user, loading, userData, router]);

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);
    const unsub = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubscriptionPlan[]);
      setIsLoading(false);
    });
    return () => unsub();
  }, [db]);

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

  if (loading || isLoading || !user || userData?.role !== 'admin') {
    return <div>Loading...</div>;
  }

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const navigationItems = [
    { name: 'ダッシュボード', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'クリニック', href: '/admin/clinics', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: '患者', href: '/admin/patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'サブスクリプションプラン', href: '/admin/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  // Open create modal
  const openCreateModal = () => {
    setEditMode(false);
    setModalForm({ id: '', name: '', price: '', priceId: '', features: '', status: 'active', description: '', billingCycle: 'monthly', maxAppointments: '', maxPrescriptions: '', maxLabTests: '', activeSubscribers: 0 });
    setShowModal(true);
    setModalError('');
  };
  // Open edit modal
  const openEditModal = (plan: SubscriptionPlan) => {
    setEditMode(true);
    setModalForm({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      priceId: plan.priceId || '',
      features: plan.features.join('\n'),
      status: plan.status,
      description: plan.description,
      billingCycle: plan.billingCycle,
      maxAppointments: plan.maxAppointments,
      maxPrescriptions: plan.maxPrescriptions,
      maxLabTests: plan.maxLabTests,
      activeSubscribers: plan.activeSubscribers || 0
    });
    setShowModal(true);
    setModalError('');
  };
  // Handle modal form change
  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setModalForm({ ...modalForm, [e.target.name]: e.target.value });
  };
  // Handle modal submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const planData = {
        name: modalForm.name,
        price: Number(modalForm.price),
        priceId: modalForm.priceId,
        features: modalForm.features.split('\n').map((f: string) => f.trim()).filter(Boolean),
        status: modalForm.status,
        description: modalForm.description,
        billingCycle: modalForm.billingCycle,
        maxAppointments: Number(modalForm.maxAppointments),
        maxPrescriptions: Number(modalForm.maxPrescriptions),
        maxLabTests: Number(modalForm.maxLabTests),
        activeSubscribers: Number(modalForm.activeSubscribers) || 0
      };
      if (editMode) {
        await updateDoc(doc(db!, 'subscriptionPlans', modalForm.id), planData);
      } else {
        await addDoc(collection(db!, 'subscriptionPlans'), planData);
      }
      setModalLoading(false);
      setShowModal(false);
      setModalForm({ id: '', name: '', price: '', priceId: '', features: '', status: 'active', description: '', billingCycle: 'monthly', maxAppointments: '', maxPrescriptions: '', maxLabTests: '', activeSubscribers: 0 });
    } catch (err: any) {
      setModalError('保存に失敗しました: ' + (err.message || err));
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">サブスクリプションプラン管理</h1>
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
            {/* Filters */}
            <div className="mb-6 flex space-x-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  プランを検索
                </label>
                <input
                  type="text"
                  id="search"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  placeholder="プラン名または説明で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  ステータスで絞り込み
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">すべてのステータス</option>
                  <option value="active">有効</option>
                  <option value="inactive">無効</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={openCreateModal}
                >
                  新しいプランを追加
                </button>
              </div>
            </div>

            {/* Subscription Plans Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {plan.status === 'active' ? '有効' : '無効'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                    <p className="mt-4 text-3xl font-bold text-gray-900">¥{plan.price.toLocaleString()}</p>
                    <p className="mt-1 text-sm text-gray-500">{plan.billingCycle === 'monthly' ? '月額' : '年額'}</p>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900">サービス上限</h4>
                      <dl className="mt-2 grid grid-cols-1 gap-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">予約</dt>
                          <dd className="text-sm text-gray-900">
                            {plan.maxAppointments === -1 ? '無制限' : plan.maxAppointments}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">処方</dt>
                          <dd className="text-sm text-gray-900">
                            {plan.maxPrescriptions === -1 ? '無制限' : plan.maxPrescriptions}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">検査</dt>
                          <dd className="text-sm text-gray-900">
                            {plan.maxLabTests === -1 ? '無制限' : plan.maxLabTests}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900">特徴</h4>
                      <ul className="mt-2 space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <span className="text-sm text-gray-600">アクティブ契約数：{plan.activeSubscribers}</span>
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => router.push(`/admin/subscriptions/${plan.id}`)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        詳細を見る
                      </button>
                      <button
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => openEditModal(plan)}
                      >
                        プランを編集
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold transition" onClick={() => setShowModal(false)} aria-label="閉じる">×</button>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">{editMode ? 'プランを編集' : '新しいプランを追加'}</h2>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">プラン名</label>
                <input type="text" name="name" value={modalForm.name} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">価格 (円)</label>
                <input type="number" name="price" value={modalForm.price} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Stripe価格ID</label>
                <input type="text" name="priceId" value={modalForm.priceId} onChange={handleModalChange} required placeholder="price_xxx..." className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">特徴 (1行ごとに入力)</label>
                <textarea name="features" value={modalForm.features} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">説明</label>
                <textarea name="description" value={modalForm.description} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">ステータス</label>
                <select name="status" value={modalForm.status} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="active">有効</option>
                  <option value="inactive">無効</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">請求サイクル</label>
                <select name="billingCycle" value={modalForm.billingCycle} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="monthly">月額</option>
                  <option value="yearly">年額</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">予約上限</label>
                  <input type="number" name="maxAppointments" value={modalForm.maxAppointments} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">処方上限</label>
                  <input type="number" name="maxPrescriptions" value={modalForm.maxPrescriptions} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">検査上限</label>
                  <input type="number" name="maxLabTests" value={modalForm.maxLabTests} onChange={handleModalChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              {modalError && <div className="text-red-500 text-sm text-center">{modalError}</div>}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition font-semibold" onClick={() => setShowModal(false)}>キャンセル</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold" disabled={modalLoading}>{modalLoading ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 