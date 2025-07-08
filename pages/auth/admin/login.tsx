import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { fetchUserProfileWithRetry } from '../../../lib/authHelpers';

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          管理者ログイン
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          管理者ダッシュボードにアクセス
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
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
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
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
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    サインイン中...
                  </>
                ) : (
                  'サインイン'
                )}
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
        </div>
      </div>
    </div>
  );
} 