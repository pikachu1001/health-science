import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { fetchUserProfileWithRetry } from '../../../lib/authHelpers';
import { FaUser, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';

export default function PatientLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!auth.signIn) {
        throw new Error('Authentication not initialized');
      }
      await auth.signIn(email, password);

      // Wait for Firebase Auth to update and get the current user
      const { getAuth } = await import('firebase/auth');
      const user = getAuth().currentUser;
      if (!user) {
        throw new Error('User not found after sign in');
      }
      let userData;
      try {
        userData = await fetchUserProfileWithRetry(user.uid);
      } catch (e) {
        setError('ユーザープロファイルが見つかりません。しばらくしてから再度お試しください。');
        setIsLoading(false);
        return;
      }
      if (userData.role !== 'patient') {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../../../lib/firebase');
        await signOut(auth!);
        setError('患者アカウントでログインしてください。');
        setIsLoading(false);
        return;
      }
      if (router.query.returnTo) {
        router.replace(router.query.returnTo as string);
      } else {
        router.push('/patient/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-email':
            setError('メールアドレスが正しくありません。');
            break;
          case 'auth/user-disabled':
            setError('このアカウントは無効化されています。');
            break;
          case 'auth/user-not-found':
            setError('このメールアドレスのアカウントは見つかりません。');
            break;
          case 'auth/wrong-password':
            setError('パスワードが正しくありません。');
            break;
          default:
            setError('サインインに失敗しました。もう一度お試しください。');
        }
      } else {
        setError('予期しないエラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-blue-100 via-white to-blue-50 shadow-md border-b border-blue-200 flex items-center px-4 h-16">
        <span className="text-2xl text-blue-600 mr-2"><FaUser /></span>
        <span className="font-extrabold text-blue-900 text-xl">患者ログイン</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex flex-col items-center mb-6">
            <FaUser className="text-blue-500 text-4xl mb-2" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">患者ログイン</h2>
          </div>
          {error && <div className="mb-4 py-2 px-4 rounded bg-red-100 text-red-700 text-center font-semibold shadow">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-blue-900 mb-1">メールアドレス</label>
              <input type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-900 mb-1">パスワード</label>
              <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 border border-transparent rounded-md shadow-lg py-3 px-4 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <FaSignInAlt /> {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link href="/auth/patient/register" className="text-blue-700 hover:underline flex items-center gap-1"><FaUser /> 新規登録はこちら</Link>
            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-blue-600 flex items-center gap-1 mt-2"><FaArrowLeft /> トップページに戻る</button>
          </div>
        </div>
      </main>
      <footer className="w-full py-4 text-center text-gray-400 text-xs border-t bg-gradient-to-r from-blue-50 to-white mt-8">
        &copy; {new Date().getFullYear()} Health Science SaaS. All rights reserved.
      </footer>
    </div>
  );
} 