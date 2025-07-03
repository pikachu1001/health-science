import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface MedicalRecord {
  id: string;
  date: string;
  type: 'consultation' | 'prescription' | 'test';
  title: string;
  description: string;
  provider: string;
  attachments?: string[];
}

interface Prescription {
  id: string;
  date: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  provider: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface TestResult {
  id: string;
  date: string;
  testName: string;
  result: string;
  referenceRange: string;
  provider: string;
  status: 'normal' | 'abnormal' | 'pending';
}

export default function PatientHealthRecords() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'records' | 'prescriptions' | 'tests'>('records');

  const [medicalRecords] = useState<MedicalRecord[]>([
    {
      id: '1',
      date: '2024-03-15',
      type: 'consultation',
      title: '再診',
      description: '田中医師による定期健康診断。全てのバイタルサインは正常です。',
      provider: 'Dr. Tanaka',
      attachments: ['blood_work.pdf', 'xray.pdf'],
    },
    {
      id: '2',
      date: '2024-02-20',
      type: 'consultation',
      title: 'Follow-up Visit',
      description: '血圧管理のための再診予約。',
      provider: 'Dr. Tanaka',
    },
  ]);

  const [prescriptions] = useState<Prescription[]>([
    {
      id: '1',
      date: '2024-03-15',
      medication: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
      provider: 'Dr. Tanaka',
      status: 'active',
    },
    {
      id: '2',
      date: '2024-02-20',
      medication: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Three times daily',
      duration: '7 days',
      provider: 'Dr. Tanaka',
      status: 'completed',
    },
  ]);

  const [testResults] = useState<TestResult[]>([
    {
      id: '1',
      date: '2024-03-15',
      testName: '全血球計算',
      result: '正常',
      referenceRange: '基準値内',
      provider: 'Tokyo Medical Lab',
      status: 'normal',
    },
    {
      id: '2',
      date: '2024-03-15',
      testName: '血圧',
      result: '120/80 mmHg',
      referenceRange: '90-120/60-80 mmHg',
      provider: 'Dr. Tanaka',
      status: 'normal',
    },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/patient/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

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
              <h1 className="ml-4 text-xl font-bold text-gray-800">健康記録</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('records')}
                className={`${activeTab === 'records'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                医療記録
              </button>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`${activeTab === 'prescriptions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                処方箋
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`${activeTab === 'tests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                検査結果
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeTab === 'records' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {medicalRecords.map(record => (
                    <li key={record.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">{record.title}</p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {record.type === 'consultation' ? '診察' : record.type === 'prescription' ? '処方箋' : record.type === 'test' ? '検査' : record.type}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">{record.provider}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">{record.description}</p>
                        </div>
                        {record.attachments && record.attachments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">添付ファイル:</p>
                            <ul className="mt-1 space-y-1">
                              {record.attachments.map((attachment, index) => (
                                <li key={index} className="text-sm text-blue-600 hover:text-blue-500">
                                  <a href="#" className="flex items-center">
                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                    </svg>
                                    {attachment}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {prescriptions.map(prescription => (
                    <li key={prescription.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">{prescription.medication}</p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prescription.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : prescription.status === 'completed'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {prescription.status === 'active' ? '有効' : prescription.status === 'completed' ? '完了' : 'キャンセル'}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">{new Date(prescription.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {prescription.dosage} - {prescription.frequency}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>期間: {prescription.duration}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">担当医: {prescription.provider}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {testResults.map(test => (
                    <li key={test.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">{test.testName}</p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${test.status === 'normal'
                                    ? 'bg-green-100 text-green-800'
                                    : test.status === 'abnormal'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                              >
                                {test.status === 'normal' ? '正常' : test.status === 'abnormal' ? '異常' : '保留中'}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">{new Date(test.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">結果: {test.result}</p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>基準値: {test.referenceRange}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">検査機関: {test.provider}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 