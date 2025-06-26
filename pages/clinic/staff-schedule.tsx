import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  schedule: {
    date: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'on-leave' | 'off';
    appointments?: {
      time: string;
      patientName: string;
      type: string;
    }[];
  }[];
}

export default function StaffSchedule() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const [staff] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'General Practitioner',
      specialties: ['General Medicine', 'Preventive Care'],
      schedule: [
        {
          date: '2024-03-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'scheduled',
          appointments: [
            { time: '10:00', patientName: 'John Doe', type: 'General Check-up' },
            { time: '11:30', patientName: 'Jane Smith', type: 'Follow-up' },
          ],
        },
        {
          date: '2024-03-21',
          startTime: '09:00',
          endTime: '17:00',
          status: 'scheduled',
        },
      ],
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      role: 'Specialist',
      specialties: ['Cardiology', 'Internal Medicine'],
      schedule: [
        {
          date: '2024-03-20',
          startTime: '10:00',
          endTime: '18:00',
          status: 'scheduled',
          appointments: [
            { time: '11:00', patientName: 'Robert Wilson', type: 'Cardiac Consultation' },
          ],
        },
        {
          date: '2024-03-21',
          startTime: '00:00',
          endTime: '00:00',
          status: 'off',
        },
      ],
    },
    {
      id: '3',
      name: 'Nurse Emma Wilson',
      role: 'Registered Nurse',
      specialties: ['Patient Care', 'Vaccination'],
      schedule: [
        {
          date: '2024-03-20',
          startTime: '08:00',
          endTime: '16:00',
          status: 'scheduled',
          appointments: [
            { time: '09:30', patientName: 'Mary Brown', type: 'Vaccination' },
          ],
        },
        {
          date: '2024-03-21',
          startTime: '00:00',
          endTime: '00:00',
          status: 'on-leave',
        },
      ],
    },
  ]);

  const roles = ['all', ...Array.from(new Set(staff.map(member => member.role)))];

  const filteredStaff = staff.filter(member =>
    selectedRole === 'all' || member.role === selectedRole
  );

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
              <h1 className="ml-4 text-xl font-bold text-gray-800">Staff Schedule</h1>
            </div>
            <div>
              <button
                onClick={() => {/* TODO: Implement add schedule modal */ }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex space-x-4">
          <div className="flex-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              日付を選択
            </label>
            <input
              type="date"
              id="date"
              name="date"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              役割で絞り込み
            </label>
            <select
              id="role"
              name="role"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff Schedule Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スタッフ名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割・専門</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スケジュール</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">予約</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((member) => {
                const daySchedule = member.schedule.find(s => s.date === selectedDate);
                return (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{member.role}</div>
                      <div className="text-xs text-gray-400">{member.specialties.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {daySchedule?.status === 'scheduled'
                        ? `${daySchedule.startTime} - ${daySchedule.endTime}`
                        : daySchedule?.status === 'on-leave'
                          ? '休暇中'
                          : '休み'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {daySchedule?.appointments?.map((appointment, index) => (
                        <div key={index} className="mb-1">
                          <span className="font-medium">{appointment.time}</span>
                          <span className="mx-2">-</span>
                          <span>{appointment.patientName}</span>
                          <span className="text-xs text-gray-400 ml-2">({appointment.type})</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${daySchedule?.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                          daySchedule?.status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {daySchedule?.status || 'Not Scheduled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {/* TODO: Implement edit schedule */ }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement view full schedule */ }}
                        className="text-green-600 hover:text-green-900"
                      >
                        全スケジュールを見る
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 