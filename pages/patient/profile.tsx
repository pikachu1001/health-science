import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

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

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/patient/login');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement actual profile update
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/patient/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="ml-4 text-xl font-bold text-gray-800">プロフィール</h1>
            </div>
            <div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEditing ? 'キャンセル' : 'プロフィールを編集'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit}>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Personal Information */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">個人情報</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          名
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            value={profileData.firstName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          姓
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            value={profileData.lastName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          メールアドレス
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={profileData.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                          電話番号
                        </label>
                        <div className="mt-1">
                          <input
                            type="tel"
                            name="phoneNumber"
                            id="phoneNumber"
                            value={profileData.phoneNumber}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                          生年月日
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            name="dateOfBirth"
                            id="dateOfBirth"
                            value={profileData.dateOfBirth}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                          住所
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="address"
                            id="address"
                            value={profileData.address}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">緊急連絡先</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">
                          氏名
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="emergencyContact.name"
                            id="emergencyContact.name"
                            value={profileData.emergencyContact.name}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700">
                          続柄
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="emergencyContact.relationship"
                            id="emergencyContact.relationship"
                            value={profileData.emergencyContact.relationship}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="emergencyContact.phoneNumber" className="block text-sm font-medium text-gray-700">
                          電話番号
                        </label>
                        <div className="mt-1">
                          <input
                            type="tel"
                            name="emergencyContact.phoneNumber"
                            id="emergencyContact.phoneNumber"
                            value={profileData.emergencyContact.phoneNumber}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical History */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">医療履歴</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-6">
                        <label htmlFor="medicalHistory.conditions" className="block text-sm font-medium text-gray-700">
                          既往症
                        </label>
                        <div className="mt-1">
                          <textarea
                            name="medicalHistory.conditions"
                            id="medicalHistory.conditions"
                            rows={3}
                            value={profileData.medicalHistory.conditions.join(', ')}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="medicalHistory.allergies" className="block text-sm font-medium text-gray-700">
                          アレルギー
                        </label>
                        <div className="mt-1">
                          <textarea
                            name="medicalHistory.allergies"
                            id="medicalHistory.allergies"
                            rows={3}
                            value={profileData.medicalHistory.allergies.join(', ')}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="medicalHistory.medications" className="block text-sm font-medium text-gray-700">
                          現在の服薬
                        </label>
                        <div className="mt-1">
                          <textarea
                            name="medicalHistory.medications"
                            id="medicalHistory.medications"
                            rows={3}
                            value={profileData.medicalHistory.medications.join(', ')}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        保存中...
                      </>
                    ) : (
                      '変更を保存'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 