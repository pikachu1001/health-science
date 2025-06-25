import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface VitalSign {
  id: string;
  date: string;
  type: string;
  value: string;
  unit: string;
}

interface Symptom {
  id: string;
  date: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'missed';
  lastTaken?: string;
}

export default function HealthTracking() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'vitals' | 'symptoms' | 'medications'>('vitals');
  const [isLoading, setIsLoading] = useState(false);

  const [vitalSigns] = useState<VitalSign[]>([
    {
      id: '1',
      date: '2024-03-15',
      type: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
    },
    {
      id: '2',
      date: '2024-03-15',
      type: 'Heart Rate',
      value: '72',
      unit: 'bpm',
    },
    {
      id: '3',
      date: '2024-03-15',
      type: 'Temperature',
      value: '36.5',
      unit: '°C',
    },
  ]);

  const [symptoms] = useState<Symptom[]>([
    {
      id: '1',
      date: '2024-03-14',
      description: 'Headache',
      severity: 'mild',
      duration: '2 hours',
    },
    {
      id: '2',
      date: '2024-03-13',
      description: 'Fatigue',
      severity: 'moderate',
      duration: '1 day',
    },
  ]);

  const [medications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Aspirin',
      dosage: '100mg',
      frequency: 'Once daily',
      startDate: '2024-03-01',
      status: 'active',
      lastTaken: '2024-03-15 08:00',
    },
    {
      id: '2',
      name: 'Vitamin D',
      dosage: '1000 IU',
      frequency: 'Once daily',
      startDate: '2024-02-15',
      status: 'active',
      lastTaken: '2024-03-15 09:00',
    },
  ]);

  const handleAddVitalSign = () => {
    // TODO: Implement add vital sign functionality
  };

  const handleAddSymptom = () => {
    // TODO: Implement add symptom functionality
  };

  const handleAddMedication = () => {
    // TODO: Implement add medication functionality
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
              <h1 className="ml-4 text-xl font-bold text-gray-800">健康管理</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`${
                activeTab === 'vitals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              バイタルサイン
            </button>
            <button
              onClick={() => setActiveTab('symptoms')}
              className={`${
                activeTab === 'symptoms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              症状
            </button>
            <button
              onClick={() => setActiveTab('medications')}
              className={`${
                activeTab === 'medications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              服薬
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'vitals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">バイタルサイン</h2>
                <button
                  onClick={handleAddVitalSign}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  バイタルサインを追加
                </button>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {vitalSigns.map((vital) => (
                    <li key={vital.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">{vital.type}</p>
                            <p className="ml-2 text-sm text-gray-500">
                              {vital.value} {vital.unit}
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">{vital.date}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'symptoms' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">症状</h2>
                <button
                  onClick={handleAddSymptom}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  症状を追加
                </button>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {symptoms.map((symptom) => (
                    <li key={symptom.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">{symptom.description}</p>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                symptom.severity === 'mild'
                                  ? 'bg-green-100 text-green-800'
                                  : symptom.severity === 'moderate'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {symptom.severity === 'mild' ? '軽度' : symptom.severity === 'moderate' ? '中等度' : '重度'}
                            </span>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">{symptom.date}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">期間: {symptom.duration}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'medications' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">服薬</h2>
                <button
                  onClick={handleAddMedication}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  服薬を追加
                </button>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {medications.map((medication) => (
                    <li key={medication.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-blue-600 truncate">{medication.name}</p>
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                medication.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : medication.status === 'completed'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {medication.status === 'active' ? '服用中' : medication.status === 'completed' ? '完了' : '飲み忘れ'}
                            </span>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="text-sm text-gray-500">{medication.dosage}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            頻度: {medication.frequency}
                            {medication.lastTaken && `｜最終服用: ${medication.lastTaken}`}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 