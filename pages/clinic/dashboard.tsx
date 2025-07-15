import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import ClinicLayout from '@/components/ClinicLayout';

export default function ClinicDashboard() {
  const { user, userData, loading, logout } = useAuth();

  // Use real-time hooks
  const clinicId = user?.uid || '';


  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <ClinicLayout>
        <div>1234</div>
      </ClinicLayout>
    </DashboardLayout>
  );
} 
