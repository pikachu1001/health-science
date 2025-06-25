import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Treatment {
  id: string;
  patientName: string;
  date: string;
  type: string;
  description: string;
  doctor: string;
  status: 'completed' | 'ongoing' | 'scheduled';
  followUpDate?: string;
  medications?: string[];
  notes?: string;
}

export default function TreatmentHistory() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const [treatments] = useState<Treatment[]>([
    {
      id: '1',
      patientName: 'John Doe',
      date: '2024-03-15',
      type: 'General Check-up',
      description: 'Regular health assessment',
      doctor: 'Dr. Smith',
      status: 'completed',
      medications: ['Vitamin D', 'Iron supplements'],
      notes: 'Patient in good health',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      date: '2024-03-18',
      type: 'Follow-up Consultation',
      description: 'Post-surgery check',
      doctor: 'Dr. Johnson',
      status: 'ongoing',
      followUpDate: '2024-03-25',
      medications: ['Pain relievers', 'Antibiotics'],
      notes: 'Recovery progressing well',
    },
  ]);

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
              <h1 className="ml-4 text-xl font-bold text-gray-800">Treatment History</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Patient Filter */}
        <div className="mb-6">
          <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
            患者で絞り込み
          </label>
          <select
            id="patient"
            name="patient"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedPatient || ''}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">All Patients</option>
            <option value="">全ての患者</option>
            <option value="John Doe">John Doe</option>
            <option value="Jane Smith">Jane Smith</option>
          </select>
        </div>

        {/* Treatment List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">治療記録</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {treatments
                .filter((treatment) => !selectedPatient || treatment.patientName === selectedPatient)
                .map((treatment) => (
                  <li key={treatment.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">{treatment.patientName}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {treatment.status === 'completed' ? '完了' : treatment.status === 'ongoing' ? '進行中' : treatment.status === 'scheduled' ? '予定' : treatment.status}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {treatment.type}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              {treatment.doctor}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              {treatment.date}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">{treatment.description}</p>
                        </div>
                        {treatment.medications && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Medications: {treatment.medications.join(', ')}
                            </p>
                          </div>
                        )}
                        {treatment.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Notes: {treatment.notes}
                            </p>
                          </div>
                        )}
                        {treatment.followUpDate && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Follow-up: {treatment.followUpDate}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 