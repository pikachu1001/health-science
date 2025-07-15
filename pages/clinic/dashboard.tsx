import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import ClinicLayout from '@/components/ClinicLayout';
import { useClinicDashboardStats, useClinicAppointments, useClinicPatients, useClinicActivityLog } from '@/lib/real-time-hooks';
import { FaUser, FaCalendarCheck, FaProcedures, FaYenSign, FaHeartbeat, FaSpinner, FaHistory, FaCheckCircle } from 'react-icons/fa';

export default function ClinicDashboard() {
  const { user, userData, loading, logout } = useAuth();

  // Use real-time hooks
  const clinicId = user?.uid || '';
  const { stats, loading: statsLoading } = useClinicDashboardStats(clinicId);
  const { appointments, loading: appointmentsLoading } = useClinicAppointments(clinicId, 5);
  const { patients, loading: patientsLoading } = useClinicPatients(clinicId, 5);
  const { activities, loading: activitiesLoading } = useClinicActivityLog(clinicId, 10);

  // Live update indicator
  const LiveIndicator = () => (
    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold animate-pulse">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>ライブ更新中
    </span>
  );

  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <ClinicLayout>
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-blue-100">
              <FaUser className="text-blue-400 text-3xl" />
              <div>
                <div className="text-sm text-gray-500 font-semibold">患者総数</div>
                <div className="text-2xl font-bold text-blue-900">{statsLoading ? <FaSpinner className="animate-spin" /> : stats.totalPatients}</div>
                <LiveIndicator />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-green-100">
              <FaCalendarCheck className="text-green-400 text-3xl" />
              <div>
                <div className="text-sm text-gray-500 font-semibold">本日の予約</div>
                <div className="text-2xl font-bold text-green-900">{statsLoading ? <FaSpinner className="animate-spin" /> : stats.appointmentsToday}</div>
                <LiveIndicator />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-yellow-100">
              <FaProcedures className="text-yellow-400 text-3xl" />
              <div>
                <div className="text-sm text-gray-500 font-semibold">未処理予約</div>
                <div className="text-2xl font-bold text-yellow-900">{statsLoading ? <FaSpinner className="animate-spin" /> : stats.pendingAppointments}</div>
                <LiveIndicator />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-pink-100">
              <FaYenSign className="text-pink-400 text-3xl" />
              <div>
                <div className="text-sm text-gray-500 font-semibold">今月の収益</div>
                <div className="text-2xl font-bold text-pink-900">{statsLoading ? <FaSpinner className="animate-spin" /> : `¥${stats.revenueThisMonth?.toLocaleString()}`}</div>
                <LiveIndicator />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-purple-100">
              <FaHeartbeat className="text-purple-400 text-3xl" />
              <div>
                <div className="text-sm text-gray-500 font-semibold">アクティブ契約</div>
                <div className="text-2xl font-bold text-purple-900">{statsLoading ? <FaSpinner className="animate-spin" /> : stats.activeSubscriptions}</div>
                <LiveIndicator />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-red-100">
              <FaCheckCircle className="text-red-400 text-3xl" />
              <div>
                <div className="text-sm text-gray-500 font-semibold">保険請求(未処理)</div>
                <div className="text-2xl font-bold text-red-900">{statsLoading ? <FaSpinner className="animate-spin" /> : stats.insuranceClaimsPending}</div>
                <LiveIndicator />
              </div>
            </div>
          </div>

          {/* Recent Appointments */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarCheck className="text-green-400" />
              <h2 className="text-lg font-bold text-green-900">最近の予約</h2>
              <LiveIndicator />
            </div>
            <div className="bg-white rounded-xl shadow p-4 border border-green-50">
              {appointmentsLoading ? (
                <div className="flex items-center gap-2 text-gray-500"><FaSpinner className="animate-spin" />読み込み中...</div>
              ) : appointments.length === 0 ? (
                <div className="text-gray-400 text-center py-4">最近の予約はありません。</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 px-2 text-left">患者名</th>
                      <th className="py-2 px-2 text-left">日付</th>
                      <th className="py-2 px-2 text-left">時間</th>
                      <th className="py-2 px-2 text-left">種類</th>
                      <th className="py-2 px-2 text-left">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-2 px-2 font-semibold">{a.patientName}</td>
                        <td className="py-2 px-2">{a.date}</td>
                        <td className="py-2 px-2">{a.time}</td>
                        <td className="py-2 px-2">{a.type}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${a.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' : a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{a.status === 'scheduled' ? '予約済' : a.status === 'completed' ? '完了' : 'キャンセル'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Recent Patients */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FaUser className="text-blue-400" />
              <h2 className="text-lg font-bold text-blue-900">新規患者</h2>
              <LiveIndicator />
            </div>
            <div className="bg-white rounded-xl shadow p-4 border border-blue-50">
              {patientsLoading ? (
                <div className="flex items-center gap-2 text-gray-500"><FaSpinner className="animate-spin" />読み込み中...</div>
              ) : patients.length === 0 ? (
                <div className="text-gray-400 text-center py-4">新規患者はいません。</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 px-2 text-left">氏名</th>
                      <th className="py-2 px-2 text-left">初診日</th>
                      <th className="py-2 px-2 text-left">次回予約</th>
                      <th className="py-2 px-2 text-left">保険</th>
                      <th className="py-2 px-2 text-left">プラン</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 px-2 font-semibold">{p.name}</td>
                        <td className="py-2 px-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="py-2 px-2">{p.nextAppointment || '-'}</td>
                        <td className="py-2 px-2">{p.insuranceProvider || '-'}</td>
                        <td className="py-2 px-2">{p.subscriptionPlan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Activity Log */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FaHistory className="text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">アクティビティ履歴</h2>
              <LiveIndicator />
            </div>
            <div className="bg-white rounded-xl shadow p-4 border border-gray-50">
              {activitiesLoading ? (
                <div className="flex items-center gap-2 text-gray-500"><FaSpinner className="animate-spin" />読み込み中...</div>
              ) : activities.length === 0 ? (
                <div className="text-gray-400 text-center py-4">アクティビティ履歴はありません。</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {activities.map((act) => (
                    <li key={act.id} className="py-2 flex items-center gap-3">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-300"></span>
                      <span className="text-sm text-gray-700">{act.description}</span>
                      <span className="ml-auto text-xs text-gray-400">{act.timestamp ? new Date(act.timestamp).toLocaleString() : '-'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </ClinicLayout>
    </DashboardLayout>
  );
} 
