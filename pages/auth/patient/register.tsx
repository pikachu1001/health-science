import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { FaUser, FaUserPlus, FaArrowLeft } from 'react-icons/fa';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  clinicId?: string;
  address?: string;
  dateOfBirth?: string;
  submit?: string;
}

interface Clinic {
  id: string;
  name: string;
}

export default function PatientRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    clinicId: '',
    address: '',
    dateOfBirth: '',
  });
  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const db = getFirestore();
        const clinicsCollection = collection(db, 'clinics');
        const querySnapshot = await getDocs(clinicsCollection);
        const clinicsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().clinicName || `クリニックID: ${doc.id}` // Fallback name
        }));
        setClinics(clinicsList);
      } catch (error) {
        console.error("クリニックの取得に失敗しました:", error);
        // Optionally set an error state to show in the UI
      }
    };

    fetchClinics();
  }, []);

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

    // Name validation
    if (!formData.firstName) {
      newErrors.firstName = '名は必須です';
    }
    if (!formData.lastName) {
      newErrors.lastName = '姓は必須です';
    }

    // Clinic ID validation
    if (!formData.clinicId) {
      newErrors.clinicId = 'クリニックを選択してください';
    }

    // Address validation
    if (!formData.address) {
      newErrors.address = '住所は必須です';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = '生年月日は必須です';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = '18歳以上である必要があります';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      // Create user account with Firebase
      await signUp(formData.email, formData.password, "patient", { 
        firstName: formData.firstName,
        lastName: formData.lastName,
        clinicId: formData.clinicId,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
      });
      
      router.push('/patient/dashboard');
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
        <span className="text-2xl text-blue-600 mr-2"><FaUser /></span>
        <span className="font-extrabold text-blue-900 text-xl">患者新規登録</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex flex-col items-center mb-6">
            <FaUserPlus className="text-blue-500 text-4xl mb-2" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">患者新規登録</h2>
          </div>
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  名
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  姓
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
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
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
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
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="clinicId" className="block text-sm font-medium text-gray-700">
                所属クリニック
              </label>
              <div className="mt-1">
                <select
                  id="clinicId"
                  name="clinicId"
                  required
                  value={formData.clinicId}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.clinicId ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="">クリニックを選択してください</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
                {errors.clinicId && (
                  <p className="mt-1 text-sm text-red-600">{errors.clinicId}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                生年月日
              </label>
              <div className="mt-1">
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
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
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
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
            <Link href="/auth/patient/login" className="text-blue-700 hover:underline flex items-center gap-1"><FaUser /> すでにアカウントをお持ちの方はこちら</Link>
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