import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminSheepListingsContent = dynamicImport(
    () => import('@/components/admin/AdminSheepListingsContent'),
    {
        ssr: false,
        loading: () => (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            </AdminLayout>
        ),
    }
);

export default function AdminSheepListingsPage() {
    return <AdminSheepListingsContent />;
}
