import ClinicLayout from '../../components/ClinicLayout';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface PatientRow {
  userId: string;
  name: string;
  plan: string;
  joinedAt: string;
  status: string;
  paymentStatus: string;
  accountCreatedAt: string;
  address: string;
  email: string;
}

export default function ClinicPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('すべて');
  const [selectedStatus, setSelectedStatus] = useState('すべて');

  // Get unique plans and statuses for dropdowns
  const planOptions = Array.from(new Set(['すべて', ...patients.map(p => p.plan).filter(Boolean)]));
  const statusOptions = Array.from(new Set(['すべて', ...patients.map(p => p.status).filter(Boolean)]));

  useEffect(() => {
    if (!user || !db) return;
    setLoading(true);
    const q = query(collection(db, 'patients'), where('clinicId', '==', user.uid));
    const unsub = onSnapshot(q, async (snapshot) => {
      const patientRows: PatientRow[] = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        // Fetch name directly from patients collection
        let name = data.userId;
        if (data.lastName || data.firstName) {
          name = `${data.lastName || ''}${data.firstName || ''}`.trim();
        }
        // Fetch subscription for plan/payment by querying subscriptions where patientId == data.userId
        let plan = '未登録';
        let paymentStatus = '未登録';
        let joinedAt = '';
        let status = data.status === 'active' ? 'アクティブ' : '非アクティブ';
        let accountCreatedAt = '';
        let address = data.address || '';
        let email = data.email || '';
        if (data.createdAt && data.createdAt.toDate) {
          accountCreatedAt = data.createdAt.toDate().toLocaleDateString();
        }
        if (db) {
          try {
            const subsQuery = query(collection(db, 'subscriptions'), where('patientId', '==', data.userId));
            const subsSnap = await getDocs(subsQuery);
            if (!subsSnap.empty) {
              let latestSub: any = null;
              subsSnap.forEach(doc => {
                const sub = doc.data();
                if (!latestSub || (sub.createdAt && latestSub.createdAt && sub.createdAt.toDate() > latestSub.createdAt.toDate())) {
                  latestSub = sub;
                }
              });
              if (latestSub) {
                plan = latestSub.planSnapshot?.name || latestSub.planId || '未登録';
                paymentStatus = latestSub.status === 'active' ? '成功' : '失敗';
                if (latestSub.createdAt && latestSub.createdAt.toDate) {
                  joinedAt = latestSub.createdAt.toDate().toLocaleDateString();
                }
                // Translate status to Japanese
                switch (latestSub.status) {
                  case 'active':
                    status = 'アクティブ';
                    break;
                  case 'canceled':
                    status = 'キャンセル';
                    break;
                  case 'past_due':
                    status = '支払い遅延';
                    break;
                  case 'trialing':
                    status = 'トライアル中';
                    break;
                  case 'unpaid':
                    status = '未払い';
                    break;
                  default:
                    status = latestSub.status;
                }
              }
            }
          } catch {}
        }
        // If no subscription date, fallback to patient joinedAt
        if (!joinedAt && data.joinedAt && data.joinedAt.toDate) {
          joinedAt = data.joinedAt.toDate().toLocaleDateString();
        }
        return { userId: data.userId, name, plan, joinedAt, status, paymentStatus, accountCreatedAt, address, email };
      }));
      setPatients(patientRows);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Filtered patients by search, plan, and status
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedPlan === 'すべて' || p.plan === selectedPlan) &&
    (selectedStatus === 'すべて' || p.status === selectedStatus)
  );

  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <ClinicLayout>
        <h1 className="text-2xl font-bold mb-4">患者管理画面</h1>
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">患者リスト（リアルタイム更新）</h2>
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-blue-900 mb-1" htmlFor="searchName">名前検索</label>
                <input
                  id="searchName"
                  type="text"
                  placeholder="名前による検索..."
                  className="px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-blue-900 mb-1" htmlFor="planSelect">プラン</label>
                <select
                  id="planSelect"
                  className="px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full bg-white"
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value)}
                >
                  {planOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-blue-900 mb-1" htmlFor="statusSelect">ステータス</label>
                <select
                  id="statusSelect"
                  className="px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full bg-white"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-gray-500">読み込み中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">患者名</th>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">プラン</th>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">購読登録日</th>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">アカウント作成日</th>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">住所</th>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">メールアドレス</th>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">ステータス</th>
                    <th className="px-4 py-2 bg-blue-50 text-blue-900 font-bold">支払い状況</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-gray-400 py-6">該当する患者がいません。</td>
                    </tr>
                  ) : (
                    filtered.map((p, idx) => (
                      <tr key={p.userId} className={`transition hover:bg-blue-50 ${idx % 2 === 1 ? 'bg-blue-50/30' : ''}`}>
                        <td className="border px-4 py-2 font-semibold max-w-[120px] truncate" title={p.name}>{p.name}</td>
                        <td className="border px-4 py-2 max-w-[80px] truncate" title={p.plan}>{p.plan}</td>
                        <td className="border px-4 py-2 max-w-[100px] truncate" title={p.joinedAt}>{p.joinedAt}</td>
                        <td className="border px-4 py-2 max-w-[100px] truncate" title={p.accountCreatedAt}>{p.accountCreatedAt}</td>
                        <td className="border px-4 py-2 max-w-[120px] truncate" title={p.address}>{p.address}</td>
                        <td className="border px-4 py-2 max-w-[160px] truncate" title={p.email}>{p.email}</td>
                        <td className="border px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'アクティブ' ? 'bg-green-100 text-green-800' : p.status === '支払い遅延' ? 'bg-yellow-100 text-yellow-800' : p.status === 'キャンセル' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span>
                        </td>
                        <td className="border px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.paymentStatus === '成功' ? 'bg-green-100 text-green-800' : p.paymentStatus === '失敗' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{p.paymentStatus}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ClinicLayout>
    </DashboardLayout>
  );
} 