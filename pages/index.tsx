import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaClinicMedical, FaUserMd, FaUser } from 'react-icons/fa';
import { plans } from '../lib/plans';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/80 shadow-sm backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <span className="text-2xl text-blue-600"><FaClinicMedical /></span>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">ヘルスサポートシステム</h1>
            </div>
            <div>
              <Link 
                href="/auth/admin/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-md"
              >
                <FaUserMd className="mr-2" /> 管理者ログイン
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center py-16 px-4 bg-gradient-to-br from-blue-100/60 to-purple-100/60">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 drop-shadow-lg">ようこそ、<span className="text-blue-600">ヘルスサポート</span>の世界へ</h2>
        <p className="mt-2 text-lg sm:text-2xl text-gray-600 max-w-2xl mx-auto mb-8">健康とウェルネスの信頼できるパートナー。患者様、クリニック、管理者のためのスマートなサブスクリプション管理。</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <button
            onClick={() => router.push('/auth/patient/login')}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-semibold rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg transition"
          >
            <FaUser className="mr-2" /> 患者ログイン
          </button>
          <button
            onClick={() => router.push('/auth/clinic/login')}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-semibold rounded-md text-white bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 shadow-lg transition"
          >
            <FaClinicMedical className="mr-2" /> クリニックログイン
          </button>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h3 className="text-3xl font-bold text-center mb-10 text-gray-800">プランを選択してください</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl shadow-xl bg-white/90 border-t-4 border-b-4 border-transparent hover:border-blue-400 transition p-8 flex flex-col items-center relative overflow-hidden">
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 pointer-events-none" />
              <span className="text-2xl font-bold text-blue-600 mb-2">{plan.name}</span>
              <span className="text-3xl font-extrabold text-gray-900 mb-2">月額{plan.price.toLocaleString()}円</span>
              <span className="text-base text-gray-500 mb-4">{plan.description}</span>
              <div className="flex flex-col items-center mb-4">
                <span className="text-sm text-gray-700">クリニック受取: <span className="font-bold text-green-600">¥{plan.commission.toLocaleString()}</span></span>
                <span className="text-sm text-gray-700">会社受取: <span className="font-bold text-purple-600">¥{plan.companyCut.toLocaleString()}</span></span>
              </div>
              <button
                onClick={() => router.push('/auth/patient/login')}
                className="mt-auto w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-4 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition"
              >
                このプランを選択
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-white/80 text-center text-gray-500 text-sm shadow-inner">
        &copy; {new Date().getFullYear()} ヘルスサポートシステム. All rights reserved.
      </footer>
    </div>
  );
} 