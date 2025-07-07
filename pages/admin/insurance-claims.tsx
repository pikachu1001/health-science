import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface InsuranceClaim {
  id: string;
  patientId: string;
  clinicId: string;
  claimAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submissionDate: string;
  processedDate?: string;
  insuranceProvider: string;
  claimType: 'medical' | 'dental' | 'vision' | 'prescription';
  description: string;
  documents: string[];
}

interface Patient { id: string; firstName: string; lastName: string; }
interface Clinic { id: string; name: string; }

export default function InsuranceClaimsPage() {
  const { user, loading, userData, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<any>({ patientId: '', clinicId: '', claimAmount: '', insuranceProvider: '', claimType: '', description: '', documents: [] });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      router.replace('/auth/admin/login');
    }
  }, [user, loading, userData, router]);

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);
    const unsubClaims = onSnapshot(collection(db, 'insuranceClaims'), (snapshot) => {
      setClaims(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InsuranceClaim[]);
      setIsLoading(false);
    });
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[]);
    });
    const unsubClinics = onSnapshot(collection(db, 'clinics'), (snapshot) => {
      setClinics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Clinic[]);
    });
    return () => { unsubClaims(); unsubPatients(); unsubClinics(); };
  }, [db]);

  if (loading || isLoading || !user || userData?.role !== 'admin') {
    return <div>Loading...</div>;
  }

  // Join claims with patient and clinic info
  const claimsWithNames = claims.map(claim => {
    const patient = patients.find(p => p.id === claim.patientId);
    const clinic = clinics.find(c => c.id === claim.clinicId);
    return {
      ...claim,
      patientName: patient ? `${patient.lastName} ${patient.firstName}` : '不明',
      clinicName: clinic ? clinic.name : '不明',
    };
  });

  // Filters and search
  const filteredClaims = claimsWithNames.filter(claim => {
    const matchesSearch =
      claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (claim.insuranceProvider || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    const matchesType = typeFilter === 'all' || claim.claimType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Status/type display maps
  const statusDisplay: { [key: string]: string } = {
    pending: '保留中', approved: '承認済み', rejected: '却下', paid: '支払済み'
  };
  const typeDisplay: { [key: string]: string } = {
    medical: '医療', dental: '歯科', vision: '視力', prescription: '処方'
  };

  // Approve/reject actions
  const handleApprove = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'insuranceClaims', id), { status: 'approved', processedDate: new Date().toISOString().slice(0, 10) });
  };
  const handleReject = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'insuranceClaims', id), { status: 'rejected', processedDate: new Date().toISOString().slice(0, 10) });
  };

  // Add claim logic
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };
  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddForm({ ...addForm, documents: Array.from(e.target.files || []) });
  };
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    if (!db) {
      setAddError('データベース接続がありません');
      setAddLoading(false);
      return;
    }
    try {
      // For now, just store file names (stub file upload)
      const docNames = addForm.documents.map((f: File) => f.name);
      await addDoc(collection(db, 'insuranceClaims'), {
        patientId: addForm.patientId,
        clinicId: addForm.clinicId,
        claimAmount: Number(addForm.claimAmount),
        status: 'pending',
        submissionDate: new Date().toISOString().slice(0, 10),
        insuranceProvider: addForm.insuranceProvider,
        claimType: addForm.claimType,
        description: addForm.description,
        documents: docNames,
      });
      setAddLoading(false);
      setShowAddModal(false);
      setAddForm({ patientId: '', clinicId: '', claimAmount: '', insuranceProvider: '', claimType: '', description: '', documents: [] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setAddError('登録に失敗しました: ' + (err.message || err));
      setAddLoading(false);
    }
  };

  const navigationItems = [
    { name: 'ダッシュボード', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'クリニック', href: '/admin/clinics', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: '患者', href: '/admin/patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'サブスクリプションプラン', href: '/admin/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">保険請求管理</h1>
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
                  請求を検索
                </label>
                <input
                  type="text"
                  id="search"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  placeholder="患者・クリニック・保険会社で検索..."
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
                  <option value="pending">保留中</option>
                  <option value="approved">承認済み</option>
                  <option value="rejected">却下</option>
                  <option value="paid">支払済み</option>
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  種類で絞り込み
                </label>
                <select
                  id="type"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">すべての種類</option>
                  <option value="medical">医療</option>
                  <option value="dental">歯科</option>
                  <option value="vision">視力</option>
                  <option value="prescription">処方</option>
                </select>
              </div>
            </div>

            {/* Add Button */}
            <div className="flex justify-end mb-4">
              <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold" onClick={() => setShowAddModal(true)}>新規請求を追加</button>
            </div>

            {/* Claims Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">請求情報</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クリニック</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{claim.id}</div>
                        <div className="text-sm text-gray-500">{typeDisplay[claim.claimType] || claim.claimType}</div>
                        <div className="text-sm text-gray-500">{claim.insuranceProvider}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{claim.patientName}</div>
                        <div className="text-sm text-gray-500">ID: {claim.patientId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{claim.clinicName}</div>
                        <div className="text-sm text-gray-500">ID: {claim.clinicId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">¥{claim.claimAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {statusDisplay[claim.status] || claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Submitted: {claim.submissionDate}</div>
                        {claim.processedDate && (
                          <div className="text-sm text-gray-500">Processed: {claim.processedDate}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          onClick={() => router.push(`/admin/insurance-claims/${claim.id}`)}
                        >
                          詳細
                        </button>
                        {claim.status === 'pending' && (
                          <>
                            <button
                              className="text-green-600 hover:text-green-900 mr-4"
                              onClick={() => handleApprove(claim.id)}
                            >
                              承認
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleReject(claim.id)}
                            >
                              却下
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold transition" onClick={() => setShowAddModal(false)} aria-label="閉じる">×</button>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">新規保険請求</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">患者</label>
                <select name="patientId" value={addForm.patientId} onChange={handleAddChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">選択してください</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">クリニック</label>
                <select name="clinicId" value={addForm.clinicId} onChange={handleAddChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">選択してください</option>
                  {clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">金額 (円)</label>
                <input type="number" name="claimAmount" value={addForm.claimAmount} onChange={handleAddChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">保険会社</label>
                <input type="text" name="insuranceProvider" value={addForm.insuranceProvider} onChange={handleAddChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">種類</label>
                <select name="claimType" value={addForm.claimType} onChange={handleAddChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">選択してください</option>
                  <option value="medical">医療</option>
                  <option value="dental">歯科</option>
                  <option value="vision">視力</option>
                  <option value="prescription">処方</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">説明</label>
                <textarea name="description" value={addForm.description} onChange={handleAddChange} required className="block w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">書類 (ファイル名のみ保存)</label>
                <input type="file" multiple ref={fileInputRef} onChange={handleAddFile} className="block w-full" />
              </div>
              {addError && <div className="text-red-500 text-sm text-center">{addError}</div>}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition font-semibold" onClick={() => setShowAddModal(false)}>キャンセル</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold" disabled={addLoading}>{addLoading ? '登録中...' : '登録'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 