import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  date: string;
  isRead: boolean;
  attachments?: string[];
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export default function PatientMessages() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    content: '',
  });

  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      participants: ['Dr. Tanaka', 'You'],
      lastMessage: 'Please remember to bring your test results to your next appointment.',
      lastMessageDate: '2024-03-15T10:30:00',
      unreadCount: 1,
    },
    {
      id: '2',
      participants: ['Dr. Suzuki', 'You'],
      lastMessage: 'Your test results are now available in your health records.',
      lastMessageDate: '2024-03-14T15:45:00',
      unreadCount: 0,
    },
  ]);

  const [messages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Dr. Tanaka',
      recipient: 'You',
      subject: 'Appointment Reminder',
      content: 'Please remember to bring your test results to your next appointment.',
      date: '2024-03-15T10:30:00',
      isRead: false,
    },
    {
      id: '2',
      sender: 'You',
      recipient: 'Dr. Tanaka',
      subject: 'Appointment Reminder',
      content: 'Thank you for the reminder. I will bring them.',
      date: '2024-03-15T11:00:00',
      isRead: true,
    },
    {
      id: '3',
      sender: 'Dr. Suzuki',
      recipient: 'You',
      subject: 'Test Results',
      content: 'Your test results are now available in your health records.',
      date: '2024-03-14T15:45:00',
      isRead: true,
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

  const handleSendMessage = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual message sending
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      setShowNewMessageModal(false);
      setNewMessage({ recipient: '', subject: '', content: '' });
    } catch (error) {
      console.error('Failed to send message:', error);
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
              <h1 className="ml-4 text-xl font-bold text-gray-800">メッセージ</h1>
            </div>
            <div>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                新規メッセージ
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="grid grid-cols-12">
              {/* Conversations List */}
              <div className="col-span-4 border-r border-gray-200">
                <div className="h-full flex flex-col">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Conversations</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {conversations.map(conversation => (
                        <li
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedConversation === conversation.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-blue-600 truncate">
                                  {conversation.participants.filter(p => p !== 'You').join(', ')}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="text-sm text-gray-500">
                                  {new Date(conversation.lastMessageDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="col-span-8">
                <div className="h-full flex flex-col">
                  {selectedConversation ? (
                    <>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4">
                          {messages
                            .filter(
                              message =>
                                message.sender === conversations.find(c => c.id === selectedConversation)?.participants[0] ||
                                message.recipient === conversations.find(c => c.id === selectedConversation)?.participants[0]
                            )
                            .map(message => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-lg rounded-lg px-4 py-2 ${
                                    message.sender === 'You'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium">{message.sender}</p>
                                    <p className="text-xs opacity-75">
                                      {new Date(message.date).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <p className="text-sm">{message.content}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="border-t border-gray-200 p-4">
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            placeholder="メッセージを入力してください..."
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            送信
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">メッセージを見るには会話を選択してください</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">新規メッセージ</h3>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
                          宛先
                        </label>
                        <select
                          id="recipient"
                          name="recipient"
                          value={newMessage.recipient}
                          onChange={e => setNewMessage({ ...newMessage, recipient: e.target.value })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">宛先を選択</option>
                          <option value="Dr. Tanaka">田中先生</option>
                          <option value="Dr. Suzuki">鈴木先生</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                          件名
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={newMessage.subject}
                          onChange={e => setNewMessage({ ...newMessage, subject: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          メッセージ
                        </label>
                        <textarea
                          id="content"
                          name="content"
                          rows={4}
                          value={newMessage.content}
                          onChange={e => setNewMessage({ ...newMessage, content: e.target.value })}
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
                  onClick={handleSendMessage}
                  disabled={isLoading || !newMessage.recipient || !newMessage.subject || !newMessage.content}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${
                    isLoading || !newMessage.recipient || !newMessage.subject || !newMessage.content
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isLoading ? '送信中...' : 'メッセージを送信'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
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