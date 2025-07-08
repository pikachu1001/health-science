import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SubscriptionPlan } from '../../lib/firestore-types';


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
    id: '',
    name: '',
    price: '',
    commission: '',
    companyCut: '',
    priceId: '',
    features: '',
    status: 'active',
    description: '',
    billingCycle: 'monthly',
    maxAppointments: '',
    maxPrescriptions: '',
    maxLabTests: ''
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
    setModalForm({
      id: '',
      name: '',
      price: '',
      commission: '',
      companyCut: '',
      priceId: '',
      features: '',
      status: 'active',
      description: '',
      billingCycle: 'monthly',
      maxAppointments: '',
      maxPrescriptions: '',
      maxLabTests: ''
    });
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
      commission: plan.commission,
      companyCut: plan.companyCut,
      priceId: plan.priceId || '',
      features: plan.features.join('\n'),
      status: plan.status,
      description: plan.description,
      billingCycle: plan.billingCycle,
      maxAppointments: plan.maxAppointments,
      maxPrescriptions: plan.maxPrescriptions,
      maxLabTests: plan.maxLabTests
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
        commission: Number(modalForm.commission),
        companyCut: Number(modalForm.companyCut),
        priceId: modalForm.priceId,
        features: modalForm.features.split('\n').map((f: string) => f.trim()).filter(Boolean),
        status: modalForm.status,
        description: modalForm.description,
        billingCycle: modalForm.billingCycle,
        maxAppointments: Number(modalForm.maxAppointments),
        maxPrescriptions: Number(modalForm.maxPrescriptions),
        maxLabTests: Number(modalForm.maxLabTests)
      };
      if (editMode) {
        await updateDoc(doc(db!, 'subscriptionPlans', modalForm.id), planData);
      } else {
        await addDoc(collection(db!, 'subscriptionPlans'), planData);
      }
      setModalLoading(false);
      setShowModal(false);
      setModalForm({
        id: '',
        name: '',
        price: '',
        commission: '',
        companyCut: '',
        priceId: '',
        features: '',
        status: 'active',
        description: '',
        billingCycle: 'monthly',
        maxAppointments: '',
        maxPrescriptions: '',
        maxLabTests: ''
      });
    } catch (err: any) {
      setModalError('保存に失敗しました: ' + (err.message || err));
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg rounded-b-2xl mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow text-blue-600 text-2xl font-extrabold mr-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
              </span>
              <h1 className="text-2xl font-extrabold text-white tracking-wide drop-shadow">サブスクリプションプラン管理</h1>
            </div>
            <div className="flex items-center space-x-4">
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
        <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 shadow-xl rounded-r-2xl flex flex-col py-6 px-2">
          <nav className="flex-1">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-base font-semibold rounded-xl transition-all duration-150 ${router.pathname === item.href
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg'
                    : 'text-blue-700 hover:bg-blue-200 hover:text-blue-900'
                  }`}
                >
                  <svg
                    className={`mr-3 h-6 w-6 ${router.pathname === item.href
                      ? 'text-white'
                      : 'text-blue-400 group-hover:text-blue-600'
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
                <div key={plan.id} className="bg-gradient-to-br from-blue-50 to-white shadow-xl rounded-2xl p-6 flex flex-col h-full border border-blue-100 hover:shadow-2xl transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {plan.name}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{plan.status === 'active' ? '有効' : '無効'}</span>
                  </div>
                  <div className="text-gray-700 text-sm mb-2">{plan.description}</div>
                  <div className="text-4xl font-extrabold text-blue-700 mb-1">¥{plan.price?.toLocaleString()}</div>
                  <div className="text-xs text-blue-400 mb-4">{plan.billingCycle === 'monthly' ? '月額' : '年額'}</div>
                  <div className="mb-2  flex flex-col grid-cols-2 gap-2 text-xs text-gray-700">
                    <div className="bg-blue-50 rounded p-2">
                      <span className="font-semibold">クリニック報酬:</span> ¥{plan.commission?.toLocaleString()}
                    </div>
                    <div className="bg-blue-50 rounded p-2">
                      <span className="font-semibold">会社取り分:</span> ¥{plan.companyCut?.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">サービス上限</h4>
                    <ul className="space-y-1">
                      <li className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 17l4 4 8-8"/></svg>
                        予約 <span className="ml-auto font-bold">{plan.maxAppointments === -1 ? '無制限' : plan.maxAppointments}</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 17l4 4 8-8"/></svg>
                        処方 <span className="ml-auto font-bold">{plan.maxPrescriptions === -1 ? '無制限' : plan.maxPrescriptions}</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 17l4 4 8-8"/></svg>
                        検査 <span className="ml-auto font-bold">{plan.maxLabTests === -1 ? '無制限' : plan.maxLabTests}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">特徴</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <svg className="w-4 h-4 text-green-400 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex space-x-2 mt-auto">
                    <button
                      onClick={() => router.push(`/admin/subscriptions/${plan.id}`)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 12H9m0 0l3-3m-3 3l3 3"/></svg>
                      詳細を見る
                    </button>
                    <button
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold shadow hover:from-green-500 hover:to-green-700 transition"
                      onClick={() => openEditModal(plan)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 20h9"/></svg>
                      プランを編集
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-br from-blue-100 to-white rounded-t-2xl px-8 pt-6 pb-3 flex items-center justify-between border-b border-blue-100">
              <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                {editMode ? (
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 20h9"/></svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                )}
                {editMode ? 'プランを編集' : '新しいプランを追加'}
              </h2>
              <button className="text-gray-400 hover:text-blue-600 text-2xl font-bold transition" onClick={() => setShowModal(false)} aria-label="閉じる">×</button>
            </div>
            <form onSubmit={handleModalSubmit} className="px-8 py-6 space-y-6">
              {/* Basic Info Section */}
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                  基本情報
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">プラン名</label>
                    <input type="text" name="name" value={modalForm.name} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">価格 (円)</label>
                    <input type="number" name="price" value={modalForm.price} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">クリニック報酬 (円)</label>
                    <input type="number" name="commission" value={modalForm.commission} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">会社取り分 (円)</label>
                    <input type="number" name="companyCut" value={modalForm.companyCut} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Stripe価格ID</label>
                    <div className="flex items-center gap-2">
                      <input type="text" name="priceId" value={modalForm.priceId} onChange={handleModalChange} required placeholder="price_xxx..." className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                      {modalForm.priceId && (
                        <button type="button" className="text-blue-500 hover:underline text-xs px-2 py-1 rounded transition hover:bg-blue-200 active:bg-blue-300" onClick={() => navigator.clipboard.writeText(modalForm.priceId)} title="コピー">コピー</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <hr className="my-2 border-blue-100" />
              {/* Description & Features Section */}
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  説明・特徴
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">説明</label>
                    <textarea name="description" value={modalForm.description} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" rows={2} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">特徴 (1行ごとに入力)</label>
                    <textarea name="features" value={modalForm.features} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" rows={4} />
                  </div>
                </div>
              </div>
              <hr className="my-2 border-blue-100" />
              {/* Limits & Status Section */}
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 17l4 4 8-8"/></svg>
                  サービス上限・その他
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">予約上限</label>
                    <input type="number" name="maxAppointments" value={modalForm.maxAppointments} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">処方上限</label>
                    <input type="number" name="maxPrescriptions" value={modalForm.maxPrescriptions} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">検査上限</label>
                    <input type="number" name="maxLabTests" value={modalForm.maxLabTests} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">ステータス</label>
                    <select name="status" value={modalForm.status} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition">
                      <option value="active">有効</option>
                      <option value="inactive">無効</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">請求サイクル</label>
                    <select name="billingCycle" value={modalForm.billingCycle} onChange={handleModalChange} required className="block w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition">
                      <option value="monthly">月額</option>
                      <option value="yearly">年額</option>
                    </select>
                  </div>
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