import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { fetchUserProfileWithRetry } from '../../../lib/authHelpers';
import { FaUserMd, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { signIn } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (!signIn) {
        throw new Error('Authentication not initialized');
      }
      await signIn(formData.email, formData.password);

      // Fetch user data from Firestore with retry
      const user = (await import('firebase/auth')).getAuth().currentUser;
      if (!user) throw new Error('User not found after sign in');
      let userData;
      try {
        userData = await fetchUserProfileWithRetry(user.uid);
      } catch (e) {
        setErrors(prev => ({
          ...prev,
          submit: 'ユーザープロファイルが見つかりません。しばらくしてから再度お試しください。'
        }));
        setIsLoading(false);
        return;
      }
      if (userData.role !== 'admin') {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('../../../lib/firebase');
        await signOut(auth!);
        setErrors(prev => ({
          ...prev,
          submit: '管理者アカウントでログインしてください。'
        }));
        setIsLoading(false);
        return;
      }
      router.push('/admin/dashboard');
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrors(prev => ({
          ...prev,
          submit: 'ログインに失敗しました。認証情報を確認して再度お試しください。'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          submit: '予期しないエラーが発生しました。もう一度お試しください。'
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-blue-100 via-white to-blue-50 shadow-md border-b border-blue-200 flex items-center px-4 h-16">
        <span className="text-2xl text-blue-600 mr-2"><FaUserMd /></span>
        <span className="font-extrabold text-blue-900 text-xl">管理者ログイン</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex flex-col items-center mb-6">
            <FaUserMd className="text-blue-500 text-4xl mb-2" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">管理者ログイン</h2>
          </div>
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-blue-900 mb-1">メールアドレス</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-900 mb-1">パスワード</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 border border-transparent rounded-md shadow-lg py-3 px-4 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  サインイン中...
                </>
              ) : (
                <>
                  <FaSignInAlt /> サインイン
                </>
              )}
            </button>
          </form>
          <div className="mt-6 flex flex-col items-center gap-2">
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