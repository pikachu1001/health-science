import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'billing' | 'privacy';
}

interface SupportResource {
  id: string;
  title: string;
  description: string;
  link: string;
  type: 'guide' | 'video' | 'article';
}

export default function Support() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });

  const [faqs] = useState<FAQ[]>([
    {
      id: '1',
      question: 'How do I book an appointment?',
      answer: 'You can book an appointment by going to the Appointments page and clicking the "Book Appointment" button. Select your preferred provider, date, and time slot.',
      category: 'general',
    },
    {
      id: '2',
      question: 'How do I upload my medical documents?',
      answer: 'Go to the Documents page and click "Upload Document". Select the document category and file, then click Upload.',
      category: 'technical',
    },
    {
      id: '3',
      question: 'How do I update my payment information?',
      answer: 'You can update your payment information in the Subscription page under the Billing section.',
      category: 'billing',
    },
    {
      id: '4',
      question: 'How is my medical data protected?',
      answer: 'We use industry-standard encryption and security measures to protect your medical data. All data is stored in compliance with healthcare privacy regulations.',
      category: 'privacy',
    },
  ]);

  const [supportResources] = useState<SupportResource[]>([
    {
      id: '1',
      title: 'Getting Started Guide',
      description: 'Learn how to use the basic features of the platform',
      link: '/guides/getting-started',
      type: 'guide',
    },
    {
      id: '2',
      title: 'Video Tutorial: Booking Appointments',
      description: 'Step-by-step guide to booking appointments',
      link: '/videos/booking-appointments',
      type: 'video',
    },
    {
      id: '3',
      title: 'Understanding Your Health Records',
      description: 'Learn how to read and understand your medical records',
      link: '/articles/understanding-records',
      type: 'article',
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

  const handleContactSubmit = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement contact form submission
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setShowContactModal(false);
      setContactForm({ subject: '', message: '', priority: 'normal' });
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

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
              <h1 className="ml-4 text-xl font-bold text-gray-800">サポート</h1>
            </div>
            <div>
              <button
                onClick={() => setShowContactModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                サポートに連絡
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Quick Help */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">クイックヘルプ</h2>
            <p className="mt-1 text-sm text-gray-500">
              すぐにサポートが必要ですか？こちらからご利用いただけます。
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">緊急サポート</p>
                  <p className="text-sm text-gray-500">24時間緊急ライン</p>
                </div>
              </div>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">メールサポート</p>
                  <p className="text-sm text-gray-500">support@healthsystem.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">ライブチャット</p>
                  <p className="text-sm text-gray-500">9時～17時利用可能</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">よくある質問</h2>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                全て
              </button>
              <button
                onClick={() => setSelectedCategory('general')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${selectedCategory === 'general'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                一般
              </button>
              <button
                onClick={() => setSelectedCategory('technical')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${selectedCategory === 'technical'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                技術
              </button>
              <button
                onClick={() => setSelectedCategory('billing')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${selectedCategory === 'billing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                請求
              </button>
              <button
                onClick={() => setSelectedCategory('privacy')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${selectedCategory === 'privacy'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                プライバシー
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="bg-white px-4 py-5 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900">{faq.question}</dt>
                  <dd className="mt-1 text-sm text-gray-500">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Help Resources */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">ヘルプリソース</h2>
            <p className="mt-1 text-sm text-gray-500">
              プラットフォームを最大限に活用するためのガイド、動画、記事をご覧ください。
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {supportResources.map((resource) => (
                <li key={resource.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {resource.type === 'guide' && (
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          )}
                          {resource.type === 'video' && (
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          {resource.type === 'article' && (
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">{resource.title}</p>
                          <p className="text-sm text-gray-500">{resource.description}</p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <Link
                          href={resource.link}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          見る
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">サポートに連絡</h3>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                          件名
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                          優先度
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          value={contactForm.priority}
                          onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="low">低</option>
                          <option value="normal">普通</option>
                          <option value="high">高</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                          メッセージ
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleContactSubmit}
                  disabled={isLoading || !contactForm.subject || !contactForm.message}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${isLoading || !contactForm.subject || !contactForm.message
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                >
                  {isLoading ? '送信中...' : 'メッセージを送信'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
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