import DashboardLayout from '../../components/DashboardLayout';
import { useRouter } from 'next/router';
import Link from 'next/link';

const navigationItems = [
  { name: 'ダッシュボード', href: '/clinic/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: '患者', href: '/clinic/patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: '予約', href: '/clinic/appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'サブスクリプション', href: '/clinic/subscriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function ClinicPatients() {
  const router = useRouter();
  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-green-50">
        <header className="sticky top-0 z-30 bg-gradient-to-r from-green-500 to-blue-600 shadow-lg rounded-b-2xl mb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow text-green-600 text-2xl font-extrabold mr-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                </span>
                <h1 className="text-2xl font-extrabold text-white tracking-wide drop-shadow">患者一覧</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="flex">
          <aside className="w-64 min-h-screen bg-gradient-to-b from-green-100 to-blue-50 shadow-xl rounded-r-2xl flex flex-col py-6 px-2">
            <nav className="flex-1">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-base font-semibold rounded-xl transition-all duration-150 ${router.pathname === item.href
                      ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white shadow-lg'
                      : 'text-green-700 hover:bg-green-200 hover:text-green-900'
                    }`}
                  >
                    <svg
                      className={`mr-3 h-6 w-6 ${router.pathname === item.href
                        ? 'text-white'
                        : 'text-green-400 group-hover:text-green-600'
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
          <main className="flex-1 p-6">
            <div className="bg-white shadow rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 mb-4">患者リスト</span>
              <div className="text-gray-500">患者データはここに表示されます（ダミー/プレースホルダー）。</div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
} 