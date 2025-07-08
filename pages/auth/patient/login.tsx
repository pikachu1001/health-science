import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { fetchUserProfileWithRetry } from '../../../lib/authHelpers';

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          患者ログイン
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="メールアドレスを入力してください"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="パスワードを入力してください"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'サインイン中...' : 'サインイン'}
              </button>
            </div>
          </form>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
            >
              トップページに戻る
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  アカウントをお持ちでない方は{' '}
                  <Link href="/auth/patient/register" className="text-blue-600 hover:text-blue-500">
                    新規登録はこちら
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 