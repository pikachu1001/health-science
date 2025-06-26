import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  provider: string;
}

interface Patient {
  id: string;
  name: string;
  lastVisit: string;
  nextAppointment?: string;
  medicalHistory: string[];
  insuranceProvider?: string;
  subscriptionPlan?: string;
  totalEarnings: number;
}

interface ClinicStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingAppointments: number;
  revenueThisMonth: number;
  activeSubscriptions: number;
  insuranceClaimsPending: number;
}

export default function ClinicDashboard() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [payingBaseFee, setPayingBaseFee] = useState(false);
  const [baseFeeError, setBaseFeeError] = useState('');

  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      patientName: 'John Doe',
      date: '2024-03-20',
      time: '10:00',
      type: 'General Check-up',
      status: 'scheduled',
      notes: 'First visit',
      provider: 'Dr. Sarah Johnson',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      date: '2024-03-20',
      time: '11:30',
      type: 'Follow-up Consultation',
      status: 'scheduled',
      provider: 'Dr. Michael Chen',
    },
  ]);

  const [patients] = useState<Patient[]>([
    {
      id: '1',
      name: 'John Doe',
      lastVisit: '2024-02-15',
      nextAppointment: '2024-03-20',
      medicalHistory: ['Regular check-up', 'Blood test'],
      insuranceProvider: 'HealthCare Plus',
      subscriptionPlan: 'Plan A',
      totalEarnings: 350000,
    },
    {
      id: '2',
      name: 'Jane Smith',
      lastVisit: '2024-02-28',
      nextAppointment: '2024-03-20',
      medicalHistory: ['Consultation', 'X-ray'],
      insuranceProvider: 'MediShield',
      subscriptionPlan: 'Plan B',
      totalEarnings: 350000,
    },
  ]);

  const [stats] = useState<ClinicStats>({
    totalPatients: 150,
    appointmentsToday: 8,
    pendingAppointments: 45,
    revenueThisMonth: 250000,
    activeSubscriptions: 120,
    insuranceClaimsPending: 15,
  });

  const navigationItems = [
    { name: 'ダッシュボード', href: '/clinic/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: '治療履歴', href: '/clinic/treatment-history', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: '診療記録', href: '/clinic/medical-charts', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: '在庫管理', href: '/clinic/inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'スタッフスケジュール', href: '/clinic/staff-schedule', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: '保険請求', href: '/clinic/insurance-claims', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const handlePayBaseFee = async () => {
    if (!user || !userData?.email) {
      setBaseFeeError('ログイン情報が見つかりません。再度ログインしてください。');
      return;
    }
    setPayingBaseFee(true);
    setBaseFeeError('');
    try {
      const res = await fetch('/api/stripe/create-clinic-base-fee-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, userId: user.uid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBaseFeeError(data.error || 'Stripe Checkoutの作成に失敗しました。');
      }
    } catch (err) {
      setBaseFeeError('Stripe Checkoutへのリダイレクト中にエラーが発生しました。');
    } finally {
      setPayingBaseFee(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/clinic/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <div className="min-h-screen bg-gray-100">
        {/* Top Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800">クリニックダッシュボード</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/clinic/appointments/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  新規予約
                </button>
                <button
                  onClick={() => {
                    // Clear any clinic-related data from localStorage/session
                    localStorage.removeItem('clinicToken');
                    sessionStorage.removeItem('clinicData');
                    // Redirect to home page
                    router.push('/');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  ログアウト
                </button>
              </div>
            </div>
            {/* Base Fee Payment Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handlePayBaseFee}
                disabled={payingBaseFee}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {payingBaseFee ? '処理中...' : '基本料金を支払う'}
              </button>
            </div>
            {baseFeeError && (
              <div className="mt-2 text-red-600 text-sm">{baseFeeError}</div>
            )}
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
              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">総患者数</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">本日の予約数</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">{stats.appointmentsToday}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">有効サブスクリプション</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">{stats.activeSubscriptions}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Today's Appointments</h2>
                <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <li key={appointment.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
                            <p className="ml-2 text-sm text-gray-500">{appointment.time}</p>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                              }`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">{appointment.type}</p>
                          <p className="text-sm text-gray-500">Provider: {appointment.provider}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recent Patients */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">Recent Patients</h2>
                <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <li key={patient.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                            <p className="ml-2 text-sm text-gray-500">Last Visit: {patient.lastVisit}</p>
                          </div>
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {patient.subscriptionPlan}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Insurance: {patient.insuranceProvider}</p>
                          <p className="text-sm text-gray-500">Next Appointment: {patient.nextAppointment}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 