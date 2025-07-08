import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaUser, FaUserEdit, FaArrowLeft, FaEnvelope, FaPhone, FaBirthdayCake, FaHome, FaSave, FaTimes } from 'react-icons/fa';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  medicalHistory: {
    conditions: string[];
    allergies: string[];
    medications: string[];
  };
}

export default function PatientProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+81 90-1234-5678',
    dateOfBirth: '1990-01-01',
    address: '123 Health Street, Tokyo, Japan',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phoneNumber: '+81 90-8765-4321',
    },
    medicalHistory: {
      conditions: ['Hypertension'],
      allergies: ['Penicillin'],
      medications: ['Lisinopril 10mg'],
    },
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/patient/login');
    }
    // Fetch profile from Firestore
    if (!loading && user && db) {
      (async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileData(prev => ({
              ...prev,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || prev.email,
              phoneNumber: data.phoneNumber || '',
              dateOfBirth: data.dateOfBirth || '',
              address: data.address || '',
            }));
          }
        } catch (err) {
          setErrorMessage('プロフィールの取得に失敗しました。');
        }
      })();
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProfileData] as Record<string, any>),
          [child]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateProfile = () => {
    let valid = true;
    let message = '';
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim() || !profileData.phoneNumber.trim() || !profileData.dateOfBirth.trim() || !profileData.address.trim()) {
      message = 'すべての必須項目を入力してください。';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(profileData.email)) {
      message = '有効なメールアドレスを入力してください。';
      valid = false;
    } else if (!/^\+?\d[\d\s\-]{7,}$/.test(profileData.phoneNumber)) {
      message = '有効な電話番号を入力してください。';
      valid = false;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(profileData.dateOfBirth)) {
      message = '生年月日はYYYY-MM-DD形式で入力してください。';
      valid = false;
    }
    setErrorMessage(message);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setIsLoading(true);
    try {
      if (!user || !db) throw new Error('ユーザー情報がありません');
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        dateOfBirth: profileData.dateOfBirth,
        address: profileData.address,
      };
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      await setDoc(doc(db, 'patients', user.uid), updateData, { merge: true });
      // Fetch latest data after save
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData(prev => ({
            ...prev,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || prev.email,
            phoneNumber: data.phoneNumber || '',
            dateOfBirth: data.dateOfBirth || '',
            address: data.address || '',
          }));
        }
      } catch (fetchErr) {
        setErrorMessage('保存後のプロフィール取得に失敗しました。');
        console.error('Fetch after save error:', fetchErr);
      }
      setIsEditing(false);
      setSuccessMessage('プロフィールが保存されました。');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage('プロフィールの保存に失敗しました: ' + (error?.message || error));
      console.error('Firestore update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Optionally reload data from server here
    setIsEditing(false);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-blue-100 via-white to-blue-50 shadow-md px-4 py-4 flex justify-between items-center border-b border-blue-200">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/patient/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-blue-200 text-base font-medium rounded-lg text-blue-800 bg-white hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 shadow-sm"
          >
            <FaArrowLeft className="mr-2" /> ダッシュボードに戻る
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-5 py-2 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaUserEdit className="mr-2" /> プロフィールを編集
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center py-8 px-2">
        <div className="w-full max-w-2xl">
          <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-blue-100 mt-8">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-blue-100 rounded-full p-4 mb-2">
                <FaUser className="text-blue-500 text-4xl" />
              </div>
              <h3 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
                個人情報
                <FaUserEdit className="text-blue-400 text-lg" />
              </h3>
            </div>
            {successMessage && (
              <div className="mb-4 py-2 px-4 rounded bg-green-100 text-green-800 text-center font-semibold shadow">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 py-2 px-4 rounded bg-red-100 text-red-700 text-center font-semibold shadow">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">姓</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      required
                    />
                  ) : (
                    <div className="text-lg font-semibold text-gray-800 bg-blue-50 rounded px-3 py-2">{profileData.lastName}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">名</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      required
                    />
                  ) : (
                    <div className="text-lg font-semibold text-gray-800 bg-blue-50 rounded px-3 py-2">{profileData.firstName}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">メールアドレス</label>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-blue-400" />
                    <span className="text-lg text-gray-700 bg-gray-50 rounded px-3 py-2 select-all">{profileData.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">電話番号</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      required
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-lg text-gray-700 bg-blue-50 rounded px-3 py-2">
                      <FaPhone className="text-blue-400" />
                      {profileData.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">生年月日</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profileData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      required
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-lg text-gray-700 bg-blue-50 rounded px-3 py-2">
                      <FaBirthdayCake className="text-blue-400" />
                      {profileData.dateOfBirth}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">住所</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      required
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-lg text-gray-700 bg-blue-50 rounded px-3 py-2">
                      <FaHome className="text-blue-400" />
                      {profileData.address}
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-5 py-2 border border-gray-300 text-base font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                  >
                    <FaTimes className="mr-2" /> キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-5 py-2 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <FaSave className="mr-2" /> {isLoading ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full py-4 text-center text-gray-400 text-xs border-t bg-gradient-to-r from-blue-50 to-white mt-8">
        &copy; {new Date().getFullYear()} Health Science SaaS. All rights reserved.
      </footer>
    </div>
  );
} 