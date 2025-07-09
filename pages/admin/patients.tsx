import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAllClinics } from '../../lib/real-time-hooks';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  subscriptionPlan: string;
  insuranceProvider: string;
  lastVisit: string;
  status: 'active' | 'inactive';
  clinicId: string;
}

interface Subscription {
  subscriptionId: string;
  patientId: string;
  status: 'active' | 'cancelled' | 'past_due';
  planId: string;
  planSnapshot?: {
    name: string;
    price: number;
    commission: number;
    companyCut: number;
  };
}

function useAllPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const data: Patient[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || '',
          phoneNumber: d.phoneNumber || '',
          dateOfBirth: d.dateOfBirth || '',
          gender: d.gender || 'other',
          subscriptionPlan: d.subscriptionPlan || '',
          insuranceProvider: d.insuranceProvider || '',
          lastVisit: d.lastVisit || '',
          status: d.status || 'inactive',
          clinicId: d.clinicId || '',
        };
      });
      setPatients(data);
    });
    return () => unsubscribe();
  }, []);
  return patients;
}

const useAllSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
      const data: Subscription[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          subscriptionId: docSnap.id,
          patientId: d.patientId || '',
          status: d.status || 'cancelled',
          planId: d.planId || '',
          planSnapshot: d.planSnapshot || undefined,
        };
      });
      setSubscriptions(data);
    });
    return () => unsubscribe();
  }, []);
  return subscriptions;
};

export default function PatientsPage() {
  const { user, loading, userData, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const patients = useAllPatients();
  const { clinics } = useAllClinics();
  const subscriptions = useAllSubscriptions();

  // Helper to get subscription status for a patient
  const getSubscriptionStatus = (patientId: string) => {
    const sub = subscriptions.find((s: Subscription) => s.patientId === patientId);
    if (sub) {
      if (sub.status === 'active') return '有効';
      if (sub.status === 'past_due') return '未払い';
      if (sub.status === 'cancelled') return 'キャンセル';
      return sub.status;
    }
    return '未加入';
  };

  // Helper to get plan name for a subscription
  const getPlanName = (subscription: Subscription) => {
    if (subscription.planSnapshot && subscription.planSnapshot.name) {
      return subscription.planSnapshot.name;
    }
    // Optionally, fetch plan from Firestore by planId if needed (not implemented here for brevity)
    return subscription.planId || '未登録';
  };

  // Modal state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      router.replace('/auth/admin/login');
    }
  }, [user, loading, userData, router]);

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

  if (loading || !user || userData?.role !== 'admin') {
    return <div>Loading...</div>;
  }

  // Modal handlers
  const openDetailsModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };
  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({ ...patient });
    setShowEditModal(true);
    setEditError('');
  };
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPatient(null);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedPatient(null);
    setEditForm({});
    setEditError('');
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    if (!db) {
      setEditError('データベース接続がありません');
      setEditLoading(false);
      return;
    }
    try {
      const patientRef = doc(db, 'patients', selectedPatient!.id);
      await updateDoc(patientRef, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        dateOfBirth: editForm.dateOfBirth,
        clinicId: editForm.clinicId,
      });
      setEditLoading(false);
      setShowEditModal(false);
    } catch (err: any) {
      setEditError('更新に失敗しました: ' + (err.message || err));
      setEditLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = (patient.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (patient.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (patient.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const subscriptionStatus = getSubscriptionStatus(patient.id);
    const matchesStatus = statusFilter === 'all' || subscriptionStatus === statusFilter;
    const subscription = subscriptions.find(s => s.patientId === patient.id);
    const matchesPlan = planFilter === 'all' || (subscription && (subscription.planId === planFilter || getPlanName(subscription) === planFilter));
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Helper to get clinic name by ID (with fallback)
  const getClinicName = (clinicId: string) => {
    const clinic = clinics.find(c => c.clinicId === clinicId);
    if (clinic) return clinic.clinicName ;
    if (clinicId) return clinicId;
    return '未登録';
  };

  const navigationItems = [
    { name: 'ダッシュボード', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'クリニック', href: '/admin/clinics', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: '患者', href: '/admin/patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'サブスクリプションプラン', href: '/admin/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  // Add plan name mapping for Japanese display
  const planNameMap: { [key: string]: string } = {
    'Plan A': 'プランA',
    'Plan B': 'プランB',
    'Plan C': 'プランC',
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
              <h1 className="text-2xl font-extrabold text-white tracking-wide drop-shadow">患者管理</h1>
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  患者を検索
                </label>
                <input
                  type="text"
                  id="search"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  placeholder="氏名またはメールアドレスで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
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
                  <option value="有効">有効</option>
                  <option value="未払い">未払い</option>
                  <option value="キャンセル">キャンセル</option>
                  <option value="未加入">未加入</option>
                </select>
              </div>
              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                  プランで絞り込み
                </label>
                <select
                  id="plan"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <option value="all">すべてのプラン</option>
                  {Array.from(new Set(subscriptions.map(s => s.planId).filter(Boolean))).map(planId => {
                    const sub = subscriptions.find(s => s.planId === planId);
                    const planName = sub && sub.planSnapshot && sub.planSnapshot.name ? sub.planSnapshot.name : planId;
                    return (
                      <option key={planId} value={planId}>{planName}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者情報</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">連絡先</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">サブスクリプション</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クリニック</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.lastName} {patient.firstName}</div>
                        <div className="text-sm text-gray-500">
                          {patient.gender === 'male' ? '男性' : patient.gender === 'female' ? '女性' : 'その他'} ・ {patient.dateOfBirth}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.email}</div>
                        <div className="text-sm text-gray-500">{patient.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{
                          (() => {
                            const sub = subscriptions.find(s => s.patientId === patient.id);
                            return sub ? getPlanName(sub) : '未登録';
                          })()
                        }</div>
                        <div className="text-sm text-gray-500">最終受診日: {patient.lastVisit}</div>
                      </td>
                      <td className={
                        getSubscriptionStatus(patient.id) === '有効' ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' :
                        getSubscriptionStatus(patient.id) === '未払い' ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800' :
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
                      }>
                        {getSubscriptionStatus(patient.id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getClinicName(patient.clinicId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="inline-flex items-center px-3 py-1 mr-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          onClick={() => openDetailsModal(patient)}
                          aria-label="詳細"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                          詳細
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          onClick={() => openEditModal(patient)}
                          aria-label="編集"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5h2m-1 0v14m-7-7h14" /></svg>
                          編集
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-xl relative animate-fade-in">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-bold transition" onClick={closeDetailsModal} aria-label="閉じる">×</button>
            <h2 className="text-2xl font-extrabold mb-8 text-center tracking-wide">患者詳細</h2>
            <div className="space-y-4 text-base">
              <div className="flex"><span className="font-semibold w-32">氏名:</span><span className="ml-2">{selectedPatient.lastName} {selectedPatient.firstName}</span></div>
              <div className="flex"><span className="font-semibold w-32">生年月日:</span><span className="ml-2">{selectedPatient.dateOfBirth}</span></div>
              <div className="flex"><span className="font-semibold w-32">メール:</span><span className="ml-2">{selectedPatient.email}</span></div>
              <div className="flex"><span className="font-semibold w-32">クリニック:</span><span className="ml-2">{getClinicName(selectedPatient.clinicId)}</span></div>
              <div className="flex"><span className="font-semibold w-32">ステータス:</span><span className={
                'ml-2 ' + (getSubscriptionStatus(selectedPatient.id) === '有効' ? 'text-green-600 font-semibold' :
                getSubscriptionStatus(selectedPatient.id) === '未払い' ? 'text-yellow-600 font-semibold' :
                'text-gray-600 font-semibold')
              }>{getSubscriptionStatus(selectedPatient.id)}</span></div>
            </div>
            <div className="flex justify-end mt-10">
              <button className="px-7 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 font-semibold text-base transition" onClick={closeDetailsModal}>閉じる</button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-xl relative animate-fade-in">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-bold transition" onClick={closeEditModal} aria-label="閉じる">×</button>
            <h2 className="text-2xl font-extrabold mb-8 text-center tracking-wide">患者編集</h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-semibold mb-2">姓</label>
                <input type="text" name="lastName" value={editForm.lastName || ''} onChange={handleEditChange} className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 text-base" />
              </div>
              <div>
                <label className="block text-base font-semibold mb-2">名</label>
                <input type="text" name="firstName" value={editForm.firstName || ''} onChange={handleEditChange} className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 text-base" />
              </div>
              <div>
                <label className="block text-base font-semibold mb-2">生年月日</label>
                <input type="date" name="dateOfBirth" value={editForm.dateOfBirth || ''} onChange={handleEditChange} className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 text-base" />
              </div>
              <div>
                <label className="block text-base font-semibold mb-2">メール</label>
                <input type="email" name="email" value={editForm.email || ''} onChange={handleEditChange} className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 text-base" />
              </div>
              <div>
                <label className="block text-base font-semibold mb-2">クリニック</label>
                <select name="clinicId" value={editForm.clinicId || ''} onChange={handleEditChange} className="block w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 text-base">
                  <option value="">クリニックを選択</option>
                  {clinics.map(clinic => (
                    <option key={clinic.clinicId} value={clinic.clinicId}>{clinic.clinicName}</option>
                  ))}
                </select>
              </div>
              {editError && <div className="text-red-500 text-base text-center">{editError}</div>}
              <div className="flex justify-end space-x-4 pt-6">
                <button type="button" className="px-7 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-gray-400 font-semibold text-base transition" onClick={closeEditModal}>キャンセル</button>
                <button type="submit" className="px-7 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 font-semibold text-base transition" disabled={editLoading}>{editLoading ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 