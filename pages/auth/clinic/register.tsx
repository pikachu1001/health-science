import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { FaClinicMedical, FaUserPlus, FaArrowLeft } from 'react-icons/fa';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  clinicName?: string;
  phoneNumber?: string;
  address?: string;
  licenseNumber?: string;
  submit?: string;
}

export default function ClinicRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    clinicName: '',
    phoneNumber: '',
    address: '',
    licenseNumber: '',
  });

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // Clinic name validation
    if (!formData.clinicName) {
      newErrors.clinicName = 'クリニック名は必須です';
    }

    // Phone validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = '電話番号は必須です';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '有効な電話番号を入力してください';
    }

    // Address validation
    if (!formData.address) {
      newErrors.address = '住所は必須です';
    }

    // License number validation
    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'ライセンス番号は必須です';
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
      await signUp(formData.email, formData.password, "clinic", {
        clinicName: formData.clinicName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        licenseNumber: formData.licenseNumber,
      });
      
      router.push('/clinic/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setErrors(prev => ({
              ...prev,
              email: 'このメールアドレスは既に使用されています。'
            }));
            break;
          case 'auth/invalid-email':
            setErrors(prev => ({
              ...prev,
              email: '有効なメールアドレスを入力してください。'
            }));
            break;
          case 'auth/operation-not-allowed':
            setErrors(prev => ({
              ...prev,
              submit: 'メール/パスワードアカウントが有効になっていません。サポートにお問い合わせください。'
            }));
            break;
          case 'auth/weak-password':
            setErrors(prev => ({
              ...prev,
              password: 'パスワードが弱すぎます。より強力なパスワードを使用してください。'
            }));
            break;
          default:
            setErrors(prev => ({
              ...prev,
              submit: 'アカウントの作成に失敗しました。もう一度お試しください。'
            }));
        }
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
        <span className="text-2xl text-blue-600 mr-2"><FaClinicMedical /></span>
        <span className="font-extrabold text-blue-900 text-xl">クリニック新規登録</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex flex-col items-center mb-6">
            <FaUserPlus className="text-blue-500 text-4xl mb-2" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">クリニック新規登録</h2>
          </div>
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                クリニック名
              </label>
              <div className="mt-1">
                <input
                  id="clinicName"
                  name="clinicName"
                  type="text"
                  required
                  value={formData.clinicName}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.clinicName ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="クリニック名を入力してください"
                />
                {errors.clinicName && (
                  <p className="mt-1 text-sm text-red-600">{errors.clinicName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="メールアドレスを入力してください"
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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="パスワードを入力してください"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認用）
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="もう一度パスワードを入力してください"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                電話番号
              </label>
              <div className="mt-1">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="電話番号を入力してください"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                住所
              </label>
              <div className="mt-1">
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="住所を入力してください"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                ライセンス番号
              </label>
              <div className="mt-1">
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.licenseNumber ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="ライセンス番号を入力してください"
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? '登録中...' : '登録'}
              </button>
            </div>
          </form>
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link href="/auth/clinic/login" className="text-blue-700 hover:underline flex items-center gap-1"><FaClinicMedical /> すでにアカウントをお持ちの方はこちら</Link>
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