import ClinicLayout from '../../components/ClinicLayout';
import DashboardLayout from '../../components/DashboardLayout';


export default function ClinicBillingPage() {
    return (
        <DashboardLayout allowedRoles={['clinic']}>
            <ClinicLayout>
                <h1 className="text-2xl font-bold mb-4">報酬・請求画面</h1>
                <div className="bg-white rounded shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-2">月別内訳</h2>
                    {/* TODO: Implement monthly breakdown, commission, base fee status */}
                    <div className="text-gray-500">ここに月別の報酬・請求情報が表示されます。</div>
                </div>
                <div className="bg-white rounded shadow p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-2">患者ごとのサマリー</h2>
                    {/* TODO: Implement per-patient summary */}
                    <div className="text-gray-500">ここに患者ごとのサマリーが表示されます。</div>
                </div>
            </ClinicLayout>
        </DashboardLayout>
    );
} 