'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, List, Users, FileText, Settings, LogOut, Loader2, Package, Menu, X, DollarSign } from 'lucide-react';
import { logout } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';

const sidebarItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'E\'lonlar', href: '/admin/listings', icon: List },
    { name: "Qo'y & Echki", href: '/admin/qoy-elon', icon: List },
    { name: 'Mahsulotlar', href: '/admin/mahsulotlar', icon: Package },
    { name: 'Foydalanuvchilar', href: '/admin/users', icon: Users },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
    { name: 'Moliya', href: '/admin/moliya', icon: DollarSign },
    { name: 'Sozlamalar', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`w-64 bg-slate-900 min-h-screen text-slate-300 flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">Ot<span className="text-primary-500">Admin</span></span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto modal-scroll">
                    {sidebarItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-600 text-white'
                                    : 'hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Chiqish</span>
                    </button>
                </div>
            </div>
        </>
    );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && (!user || !user.isAdmin)) {
            router.push('/admin/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-slate-600">Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (!user || !user.isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <span className="text-lg font-bold text-slate-900">Ot<span className="text-primary-500">Admin</span></span>
            </div>

            <div className="lg:pl-64">
                <main className="p-4 pt-16 lg:pt-8 lg:p-8 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
