'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { getAdminSheepListings, approveSheepListing, rejectSheepListing, deleteAdminSheepListing } from '@/lib/admin-api';
import {
    Check, X, Trash2, Loader2, Image as ImageIcon,
    ListFilter, Clock, CheckCircle, XCircle, TimerOff, Archive,
} from 'lucide-react';
import { AdminPagination } from '@/components/listing/AdminPagination';

const listingsCache = new Map<string, { listings: any[]; pagination: any; ts: number }>();
const countsCache = { data: null as Record<string, number> | null, ts: 0 };
const CACHE_TTL = 3 * 60_000;

function getCacheKey(tab: string, page: number, region: string) {
    return `${tab}:${page}:${region}`;
}

function invalidateCache() {
    listingsCache.clear();
    countsCache.data = null;
    countsCache.ts = 0;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type TabKey = 'all' | 'pending' | 'approved' | 'rejected' | 'expired' | 'archived';

interface Tab {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    filter: { status?: string };
}

const TABS: Tab[] = [
    { key: 'all', label: "Barcha e'lonlar", icon: <ListFilter className="w-4 h-4" />, filter: {} },
    { key: 'pending', label: 'Kutilayotgan', icon: <Clock className="w-4 h-4" />, filter: { status: 'PENDING' } },
    { key: 'approved', label: 'Tasdiqlangan', icon: <CheckCircle className="w-4 h-4" />, filter: { status: 'APPROVED' } },
    { key: 'rejected', label: 'Rad etilgan', icon: <XCircle className="w-4 h-4" />, filter: { status: 'REJECTED' } },
    { key: 'expired', label: 'Muddati tugagan', icon: <TimerOff className="w-4 h-4" />, filter: { status: 'EXPIRED' } },
    { key: 'archived', label: 'Nofaol', icon: <Archive className="w-4 h-4" />, filter: { status: 'ARCHIVED' } },
];

function getStatusBadge(status: string) {
    switch (status) {
        case 'APPROVED':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Faol</span>;
        case 'PENDING':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Kutilayotgan</span>;
        case 'REJECTED':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rad etilgan</span>;
        case 'DRAFT':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Qoralama</span>;
        case 'ARCHIVED':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Nofaol</span>;
        case 'EXPIRED':
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Muddati tugagan</span>;
        default:
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">{status}</span>;
    }
}

function AdminSheepListingsContentInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentTab = (searchParams.get('tab') as TabKey) || 'all';
    const currentPage = Number(searchParams.get('page')) || 1;

    const [listings, setListings] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabCounts, setTabCounts] = useState<Record<TabKey, number>>({
        all: 0, pending: 0, approved: 0, rejected: 0, expired: 0, archived: 0,
    });
    const [regions, setRegions] = useState<{ id: string; nameUz: string }[]>([]);
    const [selectedRegion, setSelectedRegion] = useState('');

    const activeTab = TABS.find(t => t.key === currentTab) || TABS[0];

    useEffect(() => {
        fetch(`${API_URL}/api/regions`)
            .then(r => r.json())
            .then(data => setRegions(Array.isArray(data) ? data : (data?.data ?? [])))
            .catch(() => {});
    }, []);

    const loadListings = async (forceRefresh = false) => {
        const cacheKey = getCacheKey(currentTab, currentPage, selectedRegion);
        const cached = listingsCache.get(cacheKey);
        const now = Date.now();

        if (!forceRefresh && cached && now - cached.ts < CACHE_TTL) {
            setListings(cached.listings);
            setPagination(cached.pagination);
            setIsLoading(false);
            return;
        }

        try {
            if (!cached) setIsLoading(true);
            setError(null);

            const response = await getAdminSheepListings({
                ...activeTab.filter,
                regionId: selectedRegion || undefined,
                page: currentPage,
                limit: 20,
            });

            if (response.success && response.data) {
                const listingsData = response.data.data || response.data;
                const paginationData = response.data.pagination || { page: currentPage, limit: 20, total: 0, totalPages: 0 };
                const data = Array.isArray(listingsData) ? listingsData : [];

                setListings(data);
                setPagination(paginationData);
                listingsCache.set(cacheKey, { listings: data, pagination: paginationData, ts: Date.now() });
            } else {
                setListings([]);
                setPagination({ page: currentPage, limit: 20, total: 0, totalPages: 0 });
            }
        } catch (err: any) {
            setError(err.message || "Ma'lumotlarni yuklashda xatolik");
        } finally {
            setIsLoading(false);
        }
    };

    const loadCounts = async (forceRefresh = false) => {
        const now = Date.now();
        if (!forceRefresh && countsCache.data && now - countsCache.ts < CACHE_TTL) {
            setTabCounts(countsCache.data as Record<TabKey, number>);
            return;
        }
        try {
            const results = await Promise.all(
                TABS.map(tab => getAdminSheepListings({ ...tab.filter, page: 1, limit: 1 }))
            );
            const counts: Record<string, number> = {};
            results.forEach((res, i) => {
                counts[TABS[i].key] = res?.data?.pagination?.total || 0;
            });
            countsCache.data = counts;
            countsCache.ts = Date.now();
            setTabCounts(counts as Record<TabKey, number>);
        } catch {
            // Ignore count errors
        }
    };

    useEffect(() => {
        loadListings();
    }, [currentTab, currentPage, selectedRegion]);

    useEffect(() => {
        loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const switchTab = (tab: TabKey) => {
        const params = new URLSearchParams();
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleApprove = async (id: string) => {
        if (!confirm("E'lonni tasdiqlaysizmi?")) return;
        try {
            await approveSheepListing(id);
            invalidateCache();
            await loadListings(true);
            await loadCounts(true);
        } catch (err: any) {
            alert('Xatolik: ' + err.message);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Rad etish sababini kiriting:');
        if (!reason) return;
        try {
            await rejectSheepListing(id, reason);
            invalidateCache();
            await loadListings(true);
            await loadCounts(true);
        } catch (err: any) {
            alert('Xatolik: ' + err.message);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`"${title}" e'lonini butunlay o'chirasizmi?`)) return;
        try {
            await deleteAdminSheepListing(id);
            invalidateCache();
            await loadListings(true);
            await loadCounts(true);
        } catch (err: any) {
            alert('Xatolik: ' + err.message);
        }
    };

    const getEmptyMessage = () => {
        switch (currentTab) {
            case 'pending': return "Kutilayotgan e'lonlar yo'q";
            case 'approved': return "Tasdiqlangan e'lonlar yo'q";
            case 'rejected': return "Rad etilgan e'lonlar yo'q";
            case 'expired': return "Muddati tugagan e'lonlar yo'q";
            case 'archived': return "Nofaol e'lonlar yo'q";
            default: return "Hech qanday e'lon topilmadi";
        }
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Qo&apos;y & Echki e&apos;lonlari</h1>
                <p className="text-slate-500 text-sm">Barcha qo&apos;y va echki e&apos;lonlarini boshqaring</p>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => switchTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            currentTab === tab.key
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                            currentTab === tab.key
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {tabCounts[tab.key] ?? 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                <select
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">Barcha viloyatlar</option>
                    {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.nameUz}</option>
                    ))}
                </select>
                {selectedRegion && (
                    <button
                        onClick={() => setSelectedRegion('')}
                        className="text-xs text-slate-500 hover:text-red-500 transition-colors"
                    >
                        × Filtrni tozalash
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-red-600 font-medium">Xatolik: {error}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">E&apos;lon</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Tur</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Foydalanuvchi</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Narx</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Hudud</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {listings.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.media && item.media[0] ? (
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                            <img
                                                                src={item.media[0].url?.startsWith('http') ? item.media[0].url : `${API_URL}${item.media[0].url}`}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f1f5f9/94a3b8?text=Rasm';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 flex-shrink-0">
                                                            <ImageIcon className="w-5 h-5 text-slate-300" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                                                        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString('uz-UZ')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.animalType === 'ECHKI' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                    {item.animalType === 'ECHKI' ? '🐐 Echki' : "🐑 Qo'y"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-700">
                                                        {(item.user?.displayName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-slate-600">{item.user?.displayName || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {item.priceAmount?.toLocaleString() || 0} {item.priceCurrency || 'UZS'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">{item.region?.nameUz || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(item.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {item.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(item.id)}
                                                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                title="Tasdiqlash"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(item.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Rad etish"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.title)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="O'chirish"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {listings.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <div className="p-3 bg-slate-50 rounded-full">
                                                        {activeTab.icon}
                                                    </div>
                                                    <p className="text-sm">{getEmptyMessage()}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-slate-200">
                                <AdminPagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.totalPages}
                                    searchParams={Object.fromEntries(searchParams.entries())}
                                    basePath="/admin/qoy-elon"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

export default function AdminSheepListingsContent() {
    return (
        <Suspense fallback={
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            </AdminLayout>
        }>
            <AdminSheepListingsContentInner />
        </Suspense>
    );
}
