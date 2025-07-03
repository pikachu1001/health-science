import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  provider: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  specialties: string[];
}

interface Provider {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  availability: {
    day: string;
    slots: string[];
  }[];
}

export default function PatientAppointments() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [appointmentType, setAppointmentType] = useState('');

  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      date: '2024-03-20',
      time: '10:00',
      type: 'General Check-up',
      provider: 'Dr. Tanaka',
      status: 'scheduled',
      notes: 'Please bring your insurance card',
    },
    {
      id: '2',
      date: '2024-03-15',
      time: '14:30',
      type: 'Follow-up',
      provider: 'Dr. Tanaka',
      status: 'completed',
    },
  ]);

  const [clinics] = useState<Clinic[]>([
    {
      id: '1',
      name: 'Tokyo Medical Center',
      address: '123 Health Street, Tokyo',
      specialties: ['General Medicine', 'Cardiology', 'Pediatrics'],
    },
    {
      id: '2',
      name: 'Shibuya Clinic',
      address: '456 Wellness Avenue, Shibuya',
      specialties: ['Dermatology', 'Orthopedics'],
    },
  ]);

  const [providers] = useState<Provider[]>([
    {
      id: '1',
      name: 'Dr. Tanaka',
      specialty: 'General Medicine',
      clinic: 'Tokyo Medical Center',
      availability: [
        {
          day: '2024-03-20',
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        },
        {
          day: '2024-03-21',
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        },
      ],
    },
    {
      id: '2',
      name: 'Dr. Suzuki',
      specialty: 'Cardiology',
      clinic: 'Tokyo Medical Center',
      availability: [
        {
          day: '2024-03-20',
          slots: ['13:00', '14:00', '15:00', '16:00'],
        },
        {
          day: '2024-03-21',
          slots: ['13:00', '14:00', '15:00', '16:00'],
        },
      ],
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

  const handleBookAppointment = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual appointment booking
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setShowBookingModal(false);
    } catch (error) {
      console.error('Failed to book appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual appointment cancellation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
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
              <h1 className="ml-4 text-xl font-bold text-gray-800">Appointments</h1>
              <h1 className="ml-4 text-xl font-bold text-gray-800">予約</h1>
            </div>
            <div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                予約を追加
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Upcoming Appointments */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Appointments</h3>
              <h3 className="text-lg font-medium leading-6 text-gray-900">今後の予約</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {appointments
                .filter(appointment => appointment.status === 'scheduled')
                .map(appointment => (
                  <li key={appointment.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">{appointment.type}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {appointment.status === 'scheduled' ? '予約済み' : appointment.status === 'completed' ? '完了' : 'キャンセル'}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleDateString('ja-JP')} {appointment.time}～
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">{appointment.provider}</p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">備考: 保険証をお持ちください</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Past Appointments */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Past Appointments</h3>
              <h3 className="text-lg font-medium leading-6 text-gray-900">過去の予約</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {appointments
                .filter(appointment => appointment.status === 'completed')
                .map(appointment => (
                  <li key={appointment.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">{appointment.type}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {appointment.status === 'completed' ? '完了' : appointment.status === 'scheduled' ? '予約済み' : 'キャンセル'}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleDateString('ja-JP')} {appointment.time}～
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{appointment.provider}</p>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Book an Appointment</h3>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">新しい予約</h3>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                          医師を選択
                        </label>
                        <select
                          id="provider"
                          name="provider"
                          value={selectedProvider}
                          onChange={e => setSelectedProvider(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">医師を選択してください</option>
                          {providers.map(provider => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name} - {provider.specialty}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                          日付を選択
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                          時間を選択
                        </label>
                        <select
                          id="time"
                          name="time"
                          value={selectedTime}
                          onChange={e => setSelectedTime(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">時間を選択してください</option>
                          {selectedProvider &&
                            selectedDate &&
                            providers
                              .find(p => p.id === selectedProvider)
                              ?.availability.find(a => a.day === selectedDate)
                              ?.slots.map(slot => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          予約の種類
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={appointmentType}
                          onChange={e => setAppointmentType(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">種類を選択してください</option>
                          <option value="General Check-up">一般健診</option>
                          <option value="Follow-up">再診</option>
                          <option value="Consultation">相談</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleBookAppointment}
                  disabled={isLoading || !selectedProvider || !selectedDate || !selectedTime || !appointmentType}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${isLoading || !selectedProvider || !selectedDate || !selectedTime || !appointmentType
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                >
                  {isLoading ? '予約中...' : '予約を追加'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 