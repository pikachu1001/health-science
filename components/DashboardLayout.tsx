import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRoles: ('patient' | 'clinic' | 'admin')[];
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while auth state is loading
    }

    if (!user) {
      // If not logged in, redirect to the main login page.
      router.push('/auth/patient/login');
      return;
    }

    if (userData && !allowedRoles.includes(userData.role)) {
      // If user is logged in but at the wrong dashboard, redirect to their correct one.
      switch (userData.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'clinic':
          router.push('/clinic/dashboard');
          break;
        case 'patient':
          router.push('/patient/dashboard');
          break;
        default:
          router.push('/');
      }
    }
  }, [user, userData, loading, router, allowedRoles]);

  if (loading || !user || !userData || !allowedRoles.includes(userData.role)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-4 text-lg text-gray-600">読み込み中...</span>
      </div>
    );
  }

  return <>{children}</>;
} 