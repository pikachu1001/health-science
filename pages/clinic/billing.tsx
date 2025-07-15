import ClinicLayout from '../../components/ClinicLayout';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useClinicStats, useSubscriptionStatus } from '../../lib/real-time-hooks';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { FaMoneyCheckAlt, FaTable, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';


export default function ClinicBillingPage() {
    const { user } = useAuth();
    const clinicId = user?.uid || '';
    const { stats, loading: statsLoading } = useClinicStats(clinicId);
    const { subscriptions, loading: subsLoading } = useSubscriptionStatus(clinicId);
    const [payingBaseFee, setPayingBaseFee] = useState(false);
    const [baseFeeError, setBaseFeeError] = useState('');

    // Calculate next payment date (placeholder: 1 month from last update)
    const nextPaymentDate = useMemo(() => {
        if (!stats || !stats.baseFeeStatus) return '-';
        // This would ideally come from Firestore, here we just show next month
        const now = new Date();
        return format(new Date(now.getFullYear(), now.getMonth() + 1, 1), 'yyyy-MM-dd');
    }, [stats]);

    // Commission breakdown by plan
    const commissionByPlan = useMemo(() => {
        const breakdown: Record<string, { count: number; total: number }> = {};
        subscriptions.forEach((sub: any) => {
            if (!sub.planSnapshot) return;
            const planName = sub.planSnapshot.name || sub.planId || '不明プラン';
            if (!breakdown[planName]) breakdown[planName] = { count: 0, total: 0 };
            breakdown[planName].count += 1;
            breakdown[planName].total += sub.planSnapshot.commission || 0;
        });
        return breakdown;
    }, [subscriptions]);

    // Monthly history table
    const monthlyHistory = useMemo(() => {
        const history: Record<string, { patients: number; earned: number; baseFeePaid: boolean }> = {};
        subscriptions.forEach((sub: any) => {
            if (!sub.createdAt || !sub.planSnapshot) return;
            const date = sub.createdAt.toDate ? sub.createdAt.toDate() : new Date(sub.createdAt);
            const month = format(date, 'yyyy-MM');
            if (!history[month]) history[month] = { patients: 0, earned: 0, baseFeePaid: false };
            history[month].patients += 1;
            history[month].earned += sub.planSnapshot.commission || 0;
            // For demo, mark current month as paid if baseFeeStatus is active
            if (month === format(new Date(), 'yyyy-MM')) {
                history[month].baseFeePaid = stats.baseFeeStatus === 'active';
            }
        });
        return Object.entries(history).sort((a, b) => b[0].localeCompare(a[0]));
    }, [subscriptions, stats]);

    // Calculate total commission from breakdown
    const totalCommission = useMemo(() => {
        return Object.values(commissionByPlan).reduce((sum, data) => sum + data.total, 0);
    }, [commissionByPlan]);

    // Stripe payment handler (copied from ClinicLayout)
    const handlePayBaseFee = async () => {
        if (!user || !user.email) {
            setBaseFeeError('ログイン情報が見つかりません。再度ログインしてください。');
            return;
        }
        setPayingBaseFee(true);
        setBaseFeeError('');
        try {
            const res = await fetch('/api/stripe/create-clinic-base-fee-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, userId: user.uid }),
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

    return (
        <DashboardLayout allowedRoles={['clinic']}>
            <ClinicLayout>
                <h1 className="text-3xl font-extrabold mb-8 text-blue-900 tracking-tight flex items-center gap-3">
                    <FaMoneyCheckAlt className="text-green-500" /> 報酬・請求画面
                </h1>

                {/* Base Fee Status & Reminder */}
                <section className="mb-8">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border border-green-100">
                        <div>
                            <div className="text-lg font-bold mb-2 flex items-center gap-2">
                                <FaCheckCircle className="text-green-400" /> 基本料金ステータス
                            </div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${stats.baseFeeStatus === 'active' ? 'bg-green-100 text-green-700' : stats.baseFeeStatus === 'unpaid' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{stats.baseFeeStatus === 'active' ? '支払い済み' : stats.baseFeeStatus === 'unpaid' ? '未払い' : stats.baseFeeStatus}</span>
                                <span className="text-gray-500 text-sm">次回支払日: {nextPaymentDate}</span>
                            </div>
                            {stats.baseFeeStatus !== 'active' && (
                                <div className="text-red-600 font-semibold mb-2 flex items-center gap-2"><FaExclamationCircle className="text-red-400" /> 基本料金（¥1,000/月）が未払いです。お支払いをお願いします。</div>
                            )}
                            {baseFeeError && <div className="text-red-500 text-sm mb-2">{baseFeeError}</div>}
                            {stats.baseFeeStatus !== 'active' && (
                                <button
                                    onClick={handlePayBaseFee}
                                    disabled={payingBaseFee}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-green-700 text-white shadow hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition disabled:opacity-50 mt-2"
                                >
                                    {payingBaseFee ? '処理中...' : '基本料金を支払う'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Commission Breakdown */}
                <section className="mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow p-6 border border-blue-100">
                        <div className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FaMoneyCheckAlt className="text-blue-400" /> 今月の報酬サマリー
                        </div>
                        <div className="mb-4 text-2xl font-extrabold text-green-700">合計報酬: <span>¥{totalCommission.toLocaleString()}</span></div>
                        <div className="mb-2 text-base font-semibold text-gray-700">プラン別内訳:</div>
                        <ul className="list-disc ml-8 space-y-1">
                            {Object.entries(commissionByPlan).length === 0 && <li className="text-gray-500">データなし</li>}
                            {Object.entries(commissionByPlan).map(([plan, data]) => (
                                <li key={plan} className="text-base text-gray-800">{plan} <span className="text-gray-500">× {data.count}</span> = <span className="font-bold text-green-700">¥{data.total.toLocaleString()}</span></li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Monthly History Table */}
                <section>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow p-6 border border-purple-100">
                        <div className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FaTable className="text-purple-400" /> 月別履歴
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">月</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">患者数</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">合計報酬</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">基本料金支払い</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {monthlyHistory.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-4 text-gray-500">データなし</td></tr>
                                    )}
                                    {monthlyHistory.map(([month, data]) => (
                                        <tr key={month}>
                                            <td className="px-4 py-2 font-semibold text-gray-800">{month}</td>
                                            <td className="px-4 py-2">{data.patients}</td>
                                            <td className="px-4 py-2 font-bold text-green-700">¥{data.earned.toLocaleString()}</td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${data.baseFeePaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{data.baseFeePaid ? '支払い済み' : '未払い'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                </div>
                </div>
                </section>
            </ClinicLayout>
        </DashboardLayout>
    );
} 