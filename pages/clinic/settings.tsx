import ClinicLayout from '../../components/ClinicLayout';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useClinicData } from '../../lib/real-time-hooks';
import { useState } from 'react';
import { FaHospital, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaCreditCard, FaCheckCircle, FaTimesCircle, FaBell } from 'react-icons/fa';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function ClinicSettingsPage() {
    const { user } = useAuth();
    const clinicId = user?.uid || '';
    const { clinicData, loading } = useClinicData(clinicId); // Placeholder, should come from backend
    const [notifNewPatient, setNotifNewPatient] = useState(true); // Placeholder
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');

    const openPasswordModal = () => {
        setShowPasswordModal(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setPasswordSuccess('');
    };
    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setPasswordSuccess('');
    };
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (newPassword.length < 8) {
            setPasswordError('パスワードは8文字以上で入力してください。');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('パスワードが一致しません。');
            return;
        }
        if (!currentPassword) {
            setPasswordError('現在のパスワードを入力してください。');
            return;
        }
        setPasswordLoading(true);
        try {
            const auth = getAuth();
            if (!auth.currentUser || !auth.currentUser.email) throw new Error('ユーザーが見つかりません。再度ログインしてください。');
            // Re-authenticate
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            // Update password
            await updatePassword(auth.currentUser, newPassword);
            setPasswordSuccess('パスワードが正常に変更されました。');
            setTimeout(() => {
                closePasswordModal();
            }, 1500);
        } catch (err: any) {
            if (err.code === 'auth/wrong-password') {
                setPasswordError('現在のパスワードが正しくありません。');
            } else {
                setPasswordError(err.message || 'パスワードの変更に失敗しました。');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    // Stripe connection status: check if baseFeeStripeCustomerId and baseFeeStripeSubscriptionId exist
    const isStripeConnected = !!(clinicData && (clinicData as any).baseFeeStripeCustomerId && (clinicData as any).baseFeeStripeSubscriptionId);

    // Placeholder handlers
    const handleConnectStripe = () => {
        alert('Stripe Connect onboarding flow would start here.');
    };
    const handleChangeEmail = () => {
        alert('Email change flow would start here.');
    };
    const handleResetPassword = () => {
        alert('Password reset flow would start here.');
    };
    const handleNotifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNotifNewPatient(e.target.checked);
    };

    return (
        <DashboardLayout allowedRoles={['clinic']}>
            <ClinicLayout>
                <div className="max-w-5xl mx-auto py-4">
                    <h1 className="text-3xl font-extrabold mb-8 text-blue-900 tracking-tight flex items-center gap-3">
                        <FaHospital className="text-green-500" /> クリニック設定
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left column: Clinic Info, Stripe Connect */}
                        <div className="flex flex-col gap-8">
                            {/* Clinic Info */}
                            <section className="w-full">
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow p-6 border border-green-100">
                                    <div className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-200 text-green-700 font-bold mr-2">1</span>
                                        <FaHospital className="text-green-400" /> クリニック情報
                                    </div>
                                    {loading ? (
                                        <div className="text-gray-500">読み込み中...</div>
                                    ) : clinicData ? (
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2"><FaHospital className="text-blue-400" /> <span className="font-semibold">名称:</span> {clinicData.clinicName}</li>
                                            <li className="flex items-center gap-2"><FaEnvelope className="text-blue-400" /> <span className="font-semibold">連絡用メール:</span> {clinicData.email}</li>
                                            <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-blue-400" /> <span className="font-semibold">住所:</span> {(clinicData as any).address || <span className="text-gray-400">未登録</span>}</li>
                                            <li className="flex items-center gap-2"><FaPhone className="text-blue-400" /> <span className="font-semibold">電話番号:</span> {(clinicData as any).phoneNumber || <span className="text-gray-400">未登録</span>}</li>
                                        </ul>
                                    ) : (
                                        <div className="text-red-500">クリニック情報が見つかりません。</div>
                                    )}
                                </div>
                            </section>
                            {/* Stripe Connect Status */}
                            <section className="w-full">
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow p-6 border border-green-100">
                                    <div className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-200 text-green-700 font-bold mr-2">4</span>
                                        <FaCreditCard className="text-green-400" /> Stripe 接続アカウント
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        {isStripeConnected ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold"><FaCheckCircle className="mr-1" /> 接続済み</span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold"><FaTimesCircle className="mr-1" /> 未接続</span>
                                        )}
                                    </div>
                                    <button onClick={handleConnectStripe} className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow hover:bg-green-600 transition">Stripeに接続</button>
                                </div>
                            </section>
                        </div>
                        {/* Right column: Login Info, Notification Preferences */}
                        <div className="flex flex-col gap-8">
                            {/* Login Email Change / Password Reset */}
                            <section className="w-full">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow p-6 border border-blue-100">
                                    <div className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-200 text-purple-700 font-bold mr-2">2</span>
                                        <FaLock className="text-purple-400" /> ログイン情報
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* <button onClick={handleChangeEmail} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow hover:bg-blue-600 transition">メールアドレス変更</button> */}
                                        <button onClick={openPasswordModal} className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold shadow hover:bg-purple-600 transition">パスワード変更</button>
                                    </div>
                                </div>
                            </section>
                            {/* Password Change Modal */}
                            {showPasswordModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                                        <button onClick={closePasswordModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
                                        <h2 className="text-xl font-bold mb-4 text-purple-700">パスワード変更</h2>
                                        <form onSubmit={handlePasswordChange} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">現在のパスワード</label>
                                                <input type="password" className="w-full border rounded px-3 py-2" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">新しいパスワード</label>
                                                <input type="password" className="w-full border rounded px-3 py-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1">新しいパスワード（確認）</label>
                                                <input type="password" className="w-full border rounded px-3 py-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required />
                                            </div>
                                            {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
                                            {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}
                                            <div className="flex gap-4 mt-4">
                                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded font-semibold shadow hover:bg-purple-700 transition" disabled={passwordLoading}>{passwordLoading ? '変更中...' : '変更する'}</button>
                                                <button type="button" onClick={closePasswordModal} className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold shadow hover:bg-gray-400 transition">キャンセル</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                            {/* Notification Preferences */}
                            <section className="w-full">
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow p-6 border border-purple-100">
                                    <div className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-200 text-blue-700 font-bold mr-2">3</span>
                                        <FaBell className="text-purple-400" /> 通知設定
                                    </div>
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" checked={notifNewPatient} onChange={handleNotifChange} className="form-checkbox h-5 w-5 text-blue-600" />
                                        新しい患者が登録されたときにメール通知を受け取る
                                    </label>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </ClinicLayout>
        </DashboardLayout>
    );
} 