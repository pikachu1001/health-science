import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import ClinicLayout from '@/components/ClinicLayout';
import { useClinicDashboardStats, useClinicAppointments, useClinicPatients, useClinicActivityLog, useSubscriptionData, useSubscriptionStatus } from '@/lib/real-time-hooks';
import { FaUser, FaCalendarCheck, FaProcedures, FaYenSign, FaHeartbeat, FaSpinner, FaHistory, FaCheckCircle, FaChartLine, FaUsers, FaCreditCard } from 'react-icons/fa';

// Subcomponent to display plan name for a patient
function PlanCell({ subscriptionId }: { subscriptionId?: string }) {
  const { subscriptionData, loading } = useSubscriptionData(subscriptionId || '');
  if (!subscriptionId) return <span>-</span>;
  if (loading) return <span className="text-gray-400">...</span>;
  return <span>{subscriptionData?.planSnapshot?.name || '-'}</span>;
}

export default function ClinicDashboard() {
  const { user, userData, loading, logout } = useAuth();

  // Use real-time hooks
  const clinicId = user?.uid || '';
  const { stats, loading: statsLoading } = useClinicDashboardStats(clinicId);
  const { appointments, loading: appointmentsLoading } = useClinicAppointments(clinicId, 5);
  const { patients, loading: patientsLoading } = useClinicPatients(clinicId, 5);
  const { activities, loading: activitiesLoading } = useClinicActivityLog(clinicId, 10);
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptionStatus(clinicId);

  // Map patientId to active subscription
  const patientIdToPlan: Record<string, string> = {};
  subscriptions?.forEach(sub => {
    if (sub.status === 'active' && sub.patientId && sub.planSnapshot?.name) {
      patientIdToPlan[sub.patientId] = sub.planSnapshot.name;
    }
  });

  // Live update indicator
  const LiveIndicator = () => (
    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium animate-pulse">
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>ライブ更新中
    </span>
  );

  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <ClinicLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">クリニックダッシュボード</h1>
              <p className="text-gray-600">リアルタイムでクリニックの状況を確認できます</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 hover:border-blue-200">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <FaUsers className="text-white text-2xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium mb-1">患者総数</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? <FaSpinner className="animate-spin text-blue-500" /> : stats.totalPatients}
                    </div>
                    <LiveIndicator />
                  </div>
                </div>
              </div>
            
              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-pink-100 hover:border-pink-200">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-2xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg">
                    <FaYenSign className="text-white text-2xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium mb-1">今月の収益</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? <FaSpinner className="animate-spin text-pink-500" /> : `¥${stats.revenueThisMonth?.toLocaleString()}`}
                    </div>
                    <LiveIndicator />
                  </div>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 hover:border-purple-200">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-2xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg">
                    <FaHeartbeat className="text-white text-2xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium mb-1">アクティブ契約</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? <FaSpinner className="animate-spin text-purple-500" /> : stats.activeSubscriptions}
                    </div>
                    <LiveIndicator />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Patients */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FaUser className="text-white text-xl" />
                    <h2 className="text-lg font-bold text-white">新規患者</h2>
                    <LiveIndicator />
                  </div>
                </div>
                <div className="p-6">
                  {patientsLoading ? (
                    <div className="flex items-center justify-center gap-3 text-gray-500 py-8">
                      <FaSpinner className="animate-spin text-blue-500" />
                      <span>読み込み中...</span>
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="text-center py-8">
                      <FaUser className="text-gray-300 text-4xl mx-auto mb-3" />
                      <p className="text-gray-500">新規患者はいません。</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-200">
                            <th className="py-3 px-3 text-left font-semibold">氏名</th>
                            <th className="py-3 px-3 text-left font-semibold">初診日</th>
                            <th className="py-3 px-3 text-left font-semibold">次回予約</th>
                            <th className="py-3 px-3 text-left font-semibold">プラン</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {patients.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-3 font-semibold text-gray-900">
                                {(p.firstName || p.lastName) ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '-'}
                              </td>
                              <td className="py-3 px-3 text-gray-600">
                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-3 text-gray-600">-</td>
                              <td className="py-3 px-3">
                                {subscriptionsLoading ? (
                                  <span className="text-gray-400">...</span>
                                ) : (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    (p.uid && patientIdToPlan[p.uid]) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {(p.uid && patientIdToPlan[p.uid]) || '-'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              {/* Activity Log */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FaHistory className="text-white text-xl" />
                    <h2 className="text-lg font-bold text-white">アクティビティ履歴</h2>
                    <LiveIndicator />
                  </div>
                </div>
                <div className="p-6">
                  {activitiesLoading ? (
                    <div className="flex items-center justify-center gap-3 text-gray-500 py-8">
                      <FaSpinner className="animate-spin text-gray-500" />
                      <span>読み込み中...</span>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                      <FaHistory className="text-gray-300 text-4xl mx-auto mb-3" />
                      <p className="text-gray-500">アクティビティ履歴はありません。</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((act) => (
                        <div key={act.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {act.message || act.description || '-'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {act.timestamp ? new Date(act.timestamp).toLocaleString() : '-'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </ClinicLayout>
    </DashboardLayout>
  );
} 
