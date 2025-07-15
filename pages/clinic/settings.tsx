import ClinicLayout from '../../components/ClinicLayout';
import DashboardLayout from '../../components/DashboardLayout';


export default function ClinicSettingsPage() {
  return (
    <DashboardLayout allowedRoles={['clinic']}>
      <ClinicLayout>
        <h1 className="text-2xl font-bold mb-4">クリニック設定画面</h1>
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">クリニック情報の編集</h2>
          {/* TODO: Implement clinic name, contact info editing */}
          <div className="text-gray-500">ここにクリニック情報の編集フォームが表示されます。</div>
        </div>
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">請求情報（Stripe）</h2>
          {/* TODO: Implement Stripe billing info editing */}
          <div className="text-gray-500">ここに請求情報の編集フォームが表示されます。</div>
        </div>
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">パスワード変更</h2>
          {/* TODO: Implement password change form */}
          <div className="text-gray-500">ここにパスワード変更フォームが表示されます。</div>
        </div>
      </ClinicLayout>
    </DashboardLayout>
  );
} 