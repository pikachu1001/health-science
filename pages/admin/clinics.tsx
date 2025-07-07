import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useAllClinics } from '../../lib/real-time-hooks';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Clinic {
  id: string;
  name: string;
  status: 'active' | '保留中' | '一時停止中';
  address?: string;
  specialties: string[];
  patientCount: number;
  subscriptionStatus: 'active' | 'expired';
  contactEmail: string;
  contactPhone: string;
  registrationDate: string;
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

export default function ClinicsPage() {
  const { user, loading, userData, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClinic, setSelectedClinic] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const { clinics, loading: clinicsLoading, error: clinicsError } = useAllClinics();
  const patientCounts = usePatientCountsByClinic();

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

  if (loading || !user || userData?.role !== 'admin' || clinicsLoading) {
    return <div>Loading...</div>;
  }

  if (clinicsError) {
    return <div className="text-red-500">クリニックデータの取得中にエラーが発生しました: {clinicsError}</div>;
  }

  const mappedClinics = clinics.map(clinic => ({
    id: clinic.clinicId,
    name: (clinic as any).clinicName || '',
    status: clinic.baseFeeStatus === '有効' ? 'active' : clinic.baseFeeStatus === '保留中' ? '保留中' : clinic.baseFeeStatus === '停止中' ? '一時停止中' : clinic.baseFeeStatus,
    address: (clinic as any).address || '',
    specialties: [],
    patientCount: patientCounts[clinic.clinicId] || 0,
    subscriptionStatus: 'active',
    contactEmail: clinic.email,
    contactPhone: '',
    registrationDate: clinic.createdAt && clinic.createdAt.toDate ? clinic.createdAt.toDate().toISOString().slice(0, 10) : '',
  }));

  const filteredClinics = mappedClinics.filter(clinic => {
    const name = clinic.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || clinic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const navigationItems = [
    { name: 'ダッシュボード', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'クリニック', href: '/admin/clinics', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: '患者', href: '/admin/patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'サブスクリプションプラン', href: '/admin/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: '保険請求', href: '/admin/insurance-claims', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'システム設定', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  // Modal open handlers
  const openDetailsModal = (clinic: any) => {
    setSelectedClinic(clinic);
    setShowDetailsModal(true);
  };
  const openEditModal = (clinic: any) => {
    setSelectedClinic(clinic);
    setEditForm({ ...clinic });
    setShowEditModal(true);
    setEditError('');
  };
  // Modal close handlers
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedClinic(null);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedClinic(null);
    setEditForm({});
    setEditError('');
  };

  // Edit form change handler
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Edit form submit handler
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
      const clinicRef = doc(db, 'clinics', selectedClinic.id);
      await updateDoc(clinicRef, {
        clinicName: editForm.name,
        address: editForm.address,
        email: editForm.contactEmail,
        // Add more fields as needed
      });
      setEditLoading(false);
      setShowEditModal(false);
    } catch (err: any) {
      setEditError('更新に失敗しました: ' + (err.message || err));
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">クリニック管理</h1>
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
                  クリニックを検索
                </label>
                <input
                  type="text"
                  id="search"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  placeholder="クリニック名または所在地で検索..."
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
                  <option value="保留中">承認待ち</option>
                  <option value="一時停止中">停止中</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => router.push('/admin/clinics/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  新しいクリニックを追加
                </button>
              </div>
            </div>

            {/* Clinics Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クリニック名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所在地</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">連絡先</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">サブスクリプション</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClinics.map((clinic) => (
                    <tr key={clinic.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                        <div className="text-sm text-gray-500">{clinic.specialties.join(', ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clinic.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clinic.status === 'active' ? 'bg-green-100 text-green-800' :
                          clinic.status === '保留中' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {clinic.status === 'active' ? '有効' : clinic.status === '保留中' ? '承認待ち' : '停止中'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{clinic.contactEmail}</div>
                        <div className="text-sm text-gray-500">{clinic.contactPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clinic.patientCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clinic.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {clinic.subscriptionStatus === 'active' ? '有効' : '期限切れ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          onClick={() => openDetailsModal(clinic)}
                        >
                          詳細
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => openEditModal(clinic)}
                        >
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

      {showDetailsModal && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-slide-fade-in">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold transition" onClick={closeDetailsModal} aria-label="閉じる">×</button>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 flex items-center justify-center">
              <svg className="w-7 h-7 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3H8a2 2 0 00-2 2v0a2 2 0 002 2h8a2 2 0 002-2v0a2 2 0 00-2-2z" /></svg>
              クリニック詳細
            </h2>
            <div className="space-y-3">
              <div className="flex items-center text-lg font-bold text-gray-800">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {selectedClinic.name}
              </div>
              <hr className="my-2" />
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
                <span className="font-semibold">所在地:</span> {selectedClinic.address}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 01-8 0 4 4 0 018 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0 0H9m3 0h3" /></svg>
                <span className="font-semibold">連絡先:</span> {selectedClinic.contactEmail}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="font-semibold">患者数:</span> {selectedClinic.patientCount}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                <span className="font-semibold">サブスクリプション:</span> {selectedClinic.subscriptionStatus === 'active' ? <span className="text-green-600 font-semibold">有効</span> : <span className="text-red-600 font-semibold">期限切れ</span>}
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="font-semibold">登録日:</span> {selectedClinic.registrationDate}
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold" onClick={closeDetailsModal}>閉じる</button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-slide-fade-in">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold transition" onClick={closeEditModal} aria-label="閉じる">×</button>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 flex items-center justify-center">
              <svg className="w-7 h-7 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              クリニック編集
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">クリニック名</label>
                <span className="absolute left-3 top-9 text-blue-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </span>
                <input type="text" name="name" value={editForm.name || ''} onChange={handleEditChange} required className={`block w-full border ${!editForm.name ? 'border-red-400' : 'border-gray-300'} rounded-lg px-9 py-2 focus:ring-blue-500 focus:border-blue-500`} />
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">所在地</label>
                <span className="absolute left-3 top-9 text-green-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
                </span>
                <input type="text" name="address" value={editForm.address || ''} onChange={handleEditChange} required className={`block w-full border ${!editForm.address ? 'border-red-400' : 'border-gray-300'} rounded-lg px-9 py-2 focus:ring-blue-500 focus:border-blue-500`} />
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">連絡先</label>
                <span className="absolute left-3 top-9 text-purple-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 01-8 0 4 4 0 018 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0 0H9m3 0h3" /></svg>
                </span>
                <input type="text" name="contactEmail" value={editForm.contactEmail || ''} onChange={handleEditChange} required className={`block w-full border ${!editForm.contactEmail ? 'border-red-400' : 'border-gray-300'} rounded-lg px-9 py-2 focus:ring-blue-500 focus:border-blue-500`} />
              </div>
              {/* Add more fields as needed */}
              {editError && <div className="text-red-500 text-sm text-center">{editError}</div>}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition font-semibold" onClick={closeEditModal}>キャンセル</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center min-w-[80px]" disabled={editLoading}>
                  {editLoading && <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
                  {editLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 