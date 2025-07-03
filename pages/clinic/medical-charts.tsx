import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface VitalSigns {
  date: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi: number;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  vitalSigns: VitalSigns[];
  conditions: string[];
  allergies: string[];
  medications: string[];
}

export default function MedicalCharts() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const [patients] = useState<Patient[]>([
    {
      id: '1',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      vitalSigns: [
        {
          date: '2024-03-15',
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 37.0,
          weight: 75,
          height: 175,
          bmi: 24.5,
        },
        {
          date: '2024-03-18',
          bloodPressure: '118/78',
          heartRate: 70,
          temperature: 36.9,
          weight: 74,
          height: 175,
          bmi: 24.2,
        },
      ],
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      allergies: ['Penicillin'],
      medications: ['Lisinopril', 'Metformin'],
    },
    {
      id: '2',
      name: 'Jane Smith',
      age: 32,
      gender: 'Female',
      vitalSigns: [
        {
          date: '2024-03-16',
          bloodPressure: '110/70',
          heartRate: 68,
          temperature: 36.8,
          weight: 60,
          height: 165,
          bmi: 22.0,
        },
      ],
      conditions: ['Asthma'],
      allergies: ['Pollen', 'Dust'],
      medications: ['Albuterol'],
    },
  ]);

  const selectedPatientData = patients.find(p => p.name === selectedPatient);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/clinic/login');
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
              <Link href="/clinic/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="ml-4 text-xl font-bold text-gray-800">医療チャート</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Patient Selection */}
        <div className="mb-6">
          <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
            患者を選択
          </label>
          <select
            id="patient"
            name="patient"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedPatient || ''}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">患者を選択してください</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.name}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        {selectedPatientData ? (
          <div className="space-y-6">
            {/* Patient Overview */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">患者概要</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">氏名</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedPatientData.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">年齢</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedPatientData.age}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">性別</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedPatientData.gender}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">既往症</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedPatientData.conditions.join(', ')}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">アレルギー</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedPatientData.allergies.join(', ')}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">現在の薬</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedPatientData.medications.join(', ')}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Vital Signs History */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">バイタルサイン履歴</h3>
              </div>
              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">血圧</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">心拍数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">体温</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">体重</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPatientData.vitalSigns.map((vital, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vital.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vital.bloodPressure}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vital.heartRate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vital.temperature}°C</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vital.weight} kg</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vital.bmi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">患者の医療チャートを見るには患者を選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
} 