'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HorseHeadIcon } from '@/components/icons/HorseIcons';
import {
    Plus, Edit, Eye, ChevronLeft, ChevronRight, Package,
    CheckCircle, Clock, CreditCard, XCircle, Archive,
    TimerOff, RefreshCw, MoreVertical, Share2, Heart,
    Megaphone, X, Trash2, Loader2, AlertTriangle, Info,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { getReactivationPrice } from '@/lib/api';

interface Listing {
    id: string;
    title: string;
    slug: string;
    priceAmount: number;
    priceCurrency: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'EXPIRED';
    isPaid: boolean;
    isTop: boolean;
    isPremium: boolean;
    viewCount: number;
    favoriteCount: number;
    createdAt: string;
    expiresAt?: string;
    boostExpiresAt?: string;
    publishedAt?: string;
    rejectReason?: string;
    region: { nameUz: string };
    media: Array<{ url: string; thumbUrl?: string }>;
    payments?: Array<{ packageType: string | null }>;
}

interface Product {
    id: string;
    title: string;
    slug: string;
    priceAmount: number;
    priceCurrency: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isPaid: boolean;
    viewCount: number;
    createdAt: string;
    category?: { name: string; slug: string } | null;
    media: Array<{ url: string; thumbUrl?: string }>;
}

type MainTab = 'horses' | 'sheep' | 'products';
type StatusFilter = 'active' | 'pending' | 'unpaid' | 'inactive' | 'rejected' | 'expired';
type ProductFilter = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'UNPAID';

const PRODUCT_STATUS_TABS: { key: ProductFilter; label: string; icon: any }[] = [
    { key: 'PUBLISHED', label: 'Faol', icon: CheckCircle },
    { key: 'DRAFT', label: 'Kutilayotgan', icon: Clock },
    { key: 'ARCHIVED', label: 'Bekor qilingan', icon: XCircle },
    { key: 'UNPAID', label: "To'lanmagan", icon: CreditCard },
];

function filterProducts(products: Product[], filter: ProductFilter): Product[] {
    switch (filter) {
        case 'PUBLISHED': return products.filter(p => p.status === 'PUBLISHED');
        case 'DRAFT':     return products.filter(p => p.status === 'DRAFT' && p.isPaid);
        case 'ARCHIVED':  return products.filter(p => p.status === 'ARCHIVED');
        case 'UNPAID':    return products.filter(p => !p.isPaid);
        default: return products;
    }
}

function getProductStatusCounts(products: Product[]) {
    return {
        PUBLISHED: products.filter(p => p.status === 'PUBLISHED').length,
        DRAFT:     products.filter(p => p.status === 'DRAFT' && p.isPaid).length,
        ARCHIVED:  products.filter(p => p.status === 'ARCHIVED').length,
        UNPAID:    products.filter(p => !p.isPaid).length,
    };
}

const STATUS_TABS: { key: StatusFilter; label: string; icon: any }[] = [
    { key: 'active', label: 'Faol', icon: CheckCircle },
    { key: 'pending', label: 'Kutayotgan', icon: Clock },
    { key: 'unpaid', label: "To'lanmagan", icon: CreditCard },
    { key: 'inactive', label: 'Nofaol', icon: Archive },
    { key: 'rejected', label: 'Rad etilgan', icon: XCircle },
    { key: 'expired', label: 'Muddati tugagan', icon: TimerOff },
];

const ITEMS_PER_PAGE = 12;

function filterListings(listings: Listing[], filter: StatusFilter): Listing[] {
    switch (filter) {
        case 'active':   return listings.filter(l => l.status === 'APPROVED');
        case 'pending':  return listings.filter(l => l.status === 'PENDING');
        case 'unpaid':   return listings.filter(l => !l.isPaid && l.status === 'DRAFT');
        case 'inactive': return listings.filter(l => l.status === 'ARCHIVED');
        case 'rejected': return listings.filter(l => l.status === 'REJECTED');
        case 'expired':  return listings.filter(l => l.status === 'EXPIRED');
        default: return listings;
    }
}

function getStatusCounts(listings: Listing[]) {
    return {
        active:   listings.filter(l => l.status === 'APPROVED').length,
        pending:  listings.filter(l => l.status === 'PENDING').length,
        unpaid:   listings.filter(l => !l.isPaid && l.status === 'DRAFT').length,
        inactive: listings.filter(l => l.status === 'ARCHIVED').length,
        rejected: listings.filter(l => l.status === 'REJECTED').length,
        expired:  listings.filter(l => l.status === 'EXPIRED').length,
    };
}

const MONTHS_UZ = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getDate()}-${MONTHS_UZ[d.getMonth()]}`;
}

function MyListingsPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [mainTab, setMainTab] = useState<MainTab>('horses');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
    const [productFilter, setProductFilter] = useState<ProductFilter>('PUBLISHED');
    const [listings, setListings] = useState<Listing[]>([]);
    const [sheepListings, setSheepListings] = useState<Listing[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingListings, setLoadingListings] = useState(true);
    const [loadingSheep, setLoadingSheep] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);
    const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; type: 'horses' | 'sheep' } | null>(null);
    const deactivateListingId = deactivateTarget?.id ?? null;
    const [reactivatingId, setReactivatingId] = useState<string | null>(null);
    const [reactivationModal, setReactivationModal] = useState<{ listingId: string; price: number } | null>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    const filteredListings = useMemo(() => filterListings(listings, statusFilter), [listings, statusFilter]);
    const filteredSheepListings = useMemo(() => filterListings(sheepListings, statusFilter), [sheepListings, statusFilter]);
    const statusCounts = useMemo(() => getStatusCounts(listings), [listings]);
    const sheepStatusCounts = useMemo(() => getStatusCounts(sheepListings), [sheepListings]);
    const filteredProducts = useMemo(() => filterProducts(products, productFilter), [products, productFilter]);
    const productStatusCounts = useMemo(() => getProductStatusCounts(products), [products]);

    const currentItems = mainTab === 'horses' ? filteredListings : mainTab === 'sheep' ? filteredSheepListings : filteredProducts;
    const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return currentItems.slice(start, start + ITEMS_PER_PAGE);
    }, [currentItems, currentPage]);

    const loading = mainTab === 'horses' ? loadingListings : mainTab === 'sheep' ? loadingSheep : loadingProducts;

    useEffect(() => {
        if (user) {
            fetchListings();
            fetchSheepListings();
            fetchProducts();
        }
    }, [user]);

    useEffect(() => { setCurrentPage(1); }, [mainTab, statusFilter, productFilter]);

    // Detect ?success=true from URL after listing submission
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('success') === 'true') {
                setShowSuccessBanner(true);
                setStatusFilter('pending');
                window.history.replaceState({}, '', '/profil/elonlarim');
                setTimeout(() => setShowSuccessBanner(false), 7000);
            }
        }
    }, []);

    // Close 3-dot menu on outside click
    useEffect(() => {
        if (!openMenuId) return;
        const handler = () => setOpenMenuId(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [openMenuId]);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchListings = async () => {
        try {
            const res = await fetch(`${apiBase}/api/my/listings`, {
                credentials: 'include',
            });
            const data = await res.json();
            setListings(Array.isArray(data) ? data : (data?.data ?? []));
        } catch (e) {
            console.error('Failed to fetch listings:', e);
        } finally {
            setLoadingListings(false);
        }
    };

    const fetchSheepListings = async () => {
        try {
            const res = await fetch(`${apiBase}/api/my/sheep-listings`, {
                credentials: 'include',
            });
            const data = await res.json();
            setSheepListings(Array.isArray(data) ? data : (data?.data ?? []));
        } catch (e) {
            console.error('Failed to fetch sheep listings:', e);
        } finally {
            setLoadingSheep(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${apiBase}/api/my/products`, {
                credentials: 'include',
            });
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : (data?.data ?? []));
        } catch (e) {
            console.error('Failed to fetch products:', e);
        } finally {
            setLoadingProducts(false);
        }
    };

    // EXPIRED uchun — narxni ko'rsatib, tasdiqlash so'rash
    const handleReactivationPayment = async (listingId: string) => {
        setLoadingPrice(true);
        try {
            const price = await getReactivationPrice();
            setReactivationModal({ listingId, price });
        } catch (e) {
            console.error('Failed to fetch reactivation price:', e);
        } finally {
            setLoadingPrice(false);
        }
    };

    // Modal tasdiqlangandan keyin to'lovga o'tish
    const handleConfirmReactivation = async () => {
        if (!reactivationModal) return;
        const { listingId } = reactivationModal;
        setReactivatingId(listingId);
        setReactivationModal(null);
        try {
            const res = await fetch(`${apiBase}/api/payments/create-reactivation-invoice`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId }),
            });
            const data = await res.json();
            if (data.success && data.data?.clickUrl) {
                window.location.href = data.data.clickUrl;
            }
        } catch (e) {
            console.error('Failed to create reactivation invoice:', e);
        } finally {
            setReactivatingId(null);
        }
    };

    // REJECTED uchun — /submit (qayta moderatsiyaga yuborish)
    const handleResubmit = async (listingId: string) => {
        try {
            const res = await fetch(`${apiBase}/api/my/listings/${listingId}/submit`, {
                method: 'POST',
                credentials: 'include',
            });
            if (res.status === 402) {
                const body = await res.json();
                router.push(`/elon/${body.listingId || listingId}/nashr-tolov`);
                return;
            }
            if (res.ok) await fetchListings();
        } catch (e) {
            console.error('Failed to resubmit:', e);
        }
    };

    const handleDeactivate = async (listingId: string, saleSource: 'OTBOZOR' | 'OTHER') => {
        const isSheep = deactivateTarget?.type === 'sheep';
        const endpoint = isSheep
            ? `${apiBase}/api/my/sheep-listings/${listingId}`
            : `${apiBase}/api/my/listings/${listingId}`;
        try {
            await fetch(endpoint, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleSource }),
            });
            setDeactivateTarget(null);
            if (isSheep) await fetchSheepListings();
            else await fetchListings();
        } catch (e) {
            console.error('Failed to deactivate:', e);
        }
    };

    const handleDeleteListing = async (listingId: string) => {
        if (!confirm("E'lonni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.")) return;
        try {
            await fetch(`${apiBase}/api/my/listings/${listingId}/permanent`, {
                method: 'DELETE',
                credentials: 'include',
            });
            await fetchListings();
        } catch (e) {
            console.error('Failed to delete listing:', e);
        }
    };

    const handleShare = async (listing: Listing) => {
        const url = `${window.location.origin}/ot/${listing.slug}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: listing.title, url });
            } else {
                await navigator.clipboard.writeText(url);
            }
        } catch { }
        setOpenMenuId(null);
    };

    const handleShareProduct = async (product: Product) => {
        const url = `${window.location.origin}/mahsulotlar/${product.slug}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: product.title, url });
            } else {
                await navigator.clipboard.writeText(url);
            }
        } catch { }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Mahsulotni o\'chirishni xohlaysizmi?')) return;
        try {
            await fetch(`${apiBase}/api/my/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (e) {
            console.error('Failed to delete product:', e);
        }
    };

    const getListingStatusBadge = (listing: Listing) => {
        if (listing.status === 'APPROVED')
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">Faol</span>;
        if (listing.status === 'PENDING')
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500 text-white">Kutayotgan</span>;
        if (!listing.isPaid && listing.status === 'DRAFT')
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white">To&apos;lanmagan</span>;
        if (listing.status === 'ARCHIVED')
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500 text-white">Nofaol</span>;
        if (listing.status === 'REJECTED')
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">Rad etilgan</span>;
        if (listing.status === 'EXPIRED')
            return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">Muddati tugagan</span>;
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-600 text-white">Qoralama</span>;
    };

    const getEmptyState = () => {
        const states: Record<StatusFilter, { Icon: any; color: string; title: string; desc: string }> = {
            active: { Icon: CheckCircle, color: 'text-green-400', title: "Faol e'lonlar yo'q", desc: "Tasdiqlangan e'lonlaringiz bu yerda ko'rinadi" },
            pending: { Icon: Clock, color: 'text-yellow-400', title: "Kutilayotgan e'lonlar yo'q", desc: "Tekshiruvga yuborilgan e'lonlaringiz bu yerda ko'rinadi" },
            unpaid: { Icon: CreditCard, color: 'text-orange-400', title: "To'lanmagan e'lonlar yo'q", desc: "To'lov qilinmagan e'lonlar bu yerda ko'rinadi" },
            inactive: { Icon: Archive, color: 'text-slate-400', title: "Nofaol e'lonlar yo'q", desc: "Yakunlangan e'lonlaringiz bu yerda ko'rinadi" },
            rejected: { Icon: XCircle, color: 'text-red-400', title: "Rad etilgan e'lonlar yo'q", desc: "Rad etilgan e'lonlaringiz bu yerda ko'rinadi" },
            expired: { Icon: TimerOff, color: 'text-amber-400', title: "Muddati tugagan e'lonlar yo'q", desc: "30 kunlik muddati tugagan e'lonlar bu yerda ko'rinadi" },
        };
        return states[statusFilter];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const deactivateListing = deactivateTarget?.type === 'sheep'
        ? sheepListings.find(l => l.id === deactivateListingId)
        : listings.find(l => l.id === deactivateListingId);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                {/* Success Banner */}
                {showSuccessBanner && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-green-800 dark:text-green-300">E&apos;loningiz moderatsiyaga yuborildi!</p>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">Moderatorlar tekshirib chiqqandan so&apos;ng e&apos;lon saytda ko&apos;rinadi.</p>
                        </div>
                        <button onClick={() => setShowSuccessBanner(false)} className="text-green-500 hover:text-green-700 dark:hover:text-green-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Listing Credits Banner — only show on horses tab */}
                {mainTab === 'horses' && user && (
                    user.listingCredits === 0 ? (
                        <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-red-800 dark:text-red-300">Bepul e&apos;lon joylash limitingiz tugadi</p>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                                    Yangi ot e&apos;loni joylashtirish uchun paket sotib oling.
                                </p>
                                <Link
                                    href="/paketlar"
                                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Paket sotib olish
                                </Link>
                            </div>
                        </div>
                    ) : user.listingCredits <= 1 ? (
                        <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-amber-800 dark:text-amber-300">
                                    Sizda <span className="font-bold">{user.listingCredits} ta</span> bepul e&apos;lon krediti qoldi.
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                                    Bepul e&apos;lonlaringiz tugagach, yangi e&apos;lon joylash uchun paket sotib olishingiz kerak bo&apos;ladi.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-5 p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Siz <span className="font-semibold">{user.listingCredits} ta</span> bepul e&apos;lon joylash huquqingiz bor. Limit tugagach, qo&apos;shimcha e&apos;lon uchun paket sotib olishingiz kerak.
                            </p>
                        </div>
                    )
                )}

                {/* Header */}
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                        <Link href="/profil" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-3 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Profil
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Mening e&apos;lonlarim</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">Barcha e&apos;lonlaringizni boshqaring</p>
                    </div>
                    {mainTab === 'horses' ? (
                        <Link href="/elon/yaratish" className="btn btn-primary w-full sm:w-auto justify-center">
                            <Plus className="w-5 h-5" /> Ot e&apos;loni yaratish
                        </Link>
                    ) : mainTab === 'sheep' ? (
                        <Link href="/qoy-elon/yaratish" className="btn btn-primary w-full sm:w-auto justify-center">
                            <Plus className="w-5 h-5" /> Qo&apos;y/Echki e&apos;loni yaratish
                        </Link>
                    ) : (
                        <Link href="/mahsulot/yaratish" className="btn btn-primary w-full sm:w-auto justify-center">
                            <Plus className="w-5 h-5" /> Mahsulot yaratish
                        </Link>
                    )}
                </div>

                {/* Main Tabs */}
                <div className="flex gap-1 mb-4 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto sm:inline-flex">
                    <button
                        onClick={() => setMainTab('horses')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${mainTab === 'horses' ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        <Image src="/logo.png" width={20} height={20} alt="" className="object-contain" />
                        Ot e&apos;lonlari
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${mainTab === 'horses' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>{listings.length}</span>
                    </button>
                    <button
                        onClick={() => setMainTab('sheep')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${mainTab === 'sheep' ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        🐑
                        Qo&apos;y/Echki
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${mainTab === 'sheep' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>{sheepListings.length}</span>
                    </button>
                    <button
                        onClick={() => setMainTab('products')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${mainTab === 'products' ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        <Package className="w-4 h-4" />
                        Mahsulotlar
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${mainTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>{products.length}</span>
                    </button>
                </div>

                {/* Status Sub-tabs (horses) */}
                {mainTab === 'horses' && (
                    <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
                        {STATUS_TABS.map(tab => {
                            const Icon = tab.icon;
                            const count = statusCounts[tab.key];
                            const isActive = statusFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Status Sub-tabs (sheep) */}
                {mainTab === 'sheep' && (
                    <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
                        {STATUS_TABS.map(tab => {
                            const Icon = tab.icon;
                            const count = sheepStatusCounts[tab.key];
                            const isActive = statusFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Status Sub-tabs (products) */}
                {mainTab === 'products' && (
                    <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
                        {PRODUCT_STATUS_TABS.map(tab => {
                            const Icon = tab.icon;
                            const count = productStatusCounts[tab.key];
                            const isActive = productFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setProductFilter(tab.key)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── HORSES CONTENT ── */}
                {mainTab === 'horses' ? (
                    filteredListings.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {(paginatedItems as Listing[]).map((listing) => (
                                    <div key={listing.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col">

                                        {/* Image */}
                                        <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                                            {listing.media[0] ? (
                                                <Image
                                                    src={listing.media[0].thumbUrl || listing.media[0].url}
                                                    alt={listing.title}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                    <HorseHeadIcon className="w-14 h-14" />
                                                </div>
                                            )}

                                            {/* Status badge — top left */}
                                            <div className="absolute top-2 left-2">
                                                {getListingStatusBadge(listing)}
                                            </div>

                                            {/* 3-dot menu — top right */}
                                            {listing.status !== 'PENDING' && (
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === listing.id ? null : listing.id);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {openMenuId === listing.id && (
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1"
                                                    >
                                                        {/* Ulashish — APPROVED */}
                                                        {listing.status === 'APPROVED' && (
                                                            <button
                                                                onClick={() => handleShare(listing)}
                                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                                Ulashish
                                                            </button>
                                                        )}
                                                        {/* Tahrirlash — DRAFT, REJECTED */}
                                                        {(listing.status === 'DRAFT' || listing.status === 'REJECTED') && (
                                                            <Link
                                                                href={`/elon/${listing.id}/edit`}
                                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                                onClick={() => setOpenMenuId(null)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Tahrirlash
                                                            </Link>
                                                        )}
                                                        {/* Nofaol qilish — APPROVED, EXPIRED, DRAFT */}
                                                        {(listing.status === 'APPROVED' || listing.status === 'EXPIRED' || listing.status === 'DRAFT') && (
                                                            <button
                                                                onClick={() => { setDeactivateTarget({ id: listing.id, type: 'horses' }); setOpenMenuId(null); }}
                                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                                Nofaol qilish
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            )}
                                        </div>

                                        {/* Card body */}
                                        <div className="p-3 flex flex-col flex-1">
                                            {/* Dates */}
                                            {listing.status === 'APPROVED' && listing.publishedAt ? (
                                                <div className="flex items-center justify-between text-xs mb-1.5 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg px-2 py-1">
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {formatDate(listing.publishedAt)}
                                                    </span>
                                                    {listing.expiresAt && (
                                                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(listing.expiresAt)} gacha
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
                                                    <span>{formatDate(listing.createdAt)}</span>
                                                    {listing.expiresAt && listing.status === 'EXPIRED' && (
                                                        <span className="text-amber-500 dark:text-amber-400">
                                                            tugdi: {formatDate(listing.expiresAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {/* Boost info — shown separately if boosted */}
                                            {listing.boostExpiresAt && listing.status === 'APPROVED' && (() => {
                                                const pkg = listing.payments?.[0]?.packageType;
                                                const label = listing.isPremium
                                                    ? '👑 Premium Reklama'
                                                    : pkg === 'TEZKOR_SAVDO'
                                                        ? '⚡ Tezkor Reklama'
                                                        : '🚀 Oson Reklama';
                                                const colorClass = listing.isPremium
                                                    ? 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                                                    : pkg === 'TEZKOR_SAVDO'
                                                        ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                                        : 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800';
                                                return (
                                                    <div className={`flex items-center gap-1 text-xs mb-1.5 border rounded-lg px-2 py-1 ${colorClass}`}>
                                                        <Megaphone className="w-3 h-3 flex-shrink-0" />
                                                        {label}: {formatDate(listing.boostExpiresAt)} gacha
                                                    </div>
                                                );
                                            })()}

                                            {/* Title */}
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 line-clamp-2 leading-snug">
                                                {listing.title}
                                            </h3>

                                            {/* Price */}
                                            <p className="text-base font-bold text-primary-600 dark:text-primary-400 mb-2">
                                                {listing.priceAmount.toLocaleString()} {listing.priceCurrency}
                                            </p>

                                            {/* Stats: views + saved */}
                                            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {listing.viewCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3.5 h-3.5" />
                                                    {listing.favoriteCount ?? 0}
                                                </span>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="mt-auto space-y-2">

                                                {/* FAOL: Yakunlash + Tahrirlash, Reklama qilish */}
                                                {listing.status === 'APPROVED' && (
                                                    <>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setDeactivateTarget({ id: listing.id, type: 'horses' })}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Yakunlash
                                                            </button>
                                                            <Link
                                                                href={`/elon/${listing.id}/edit`}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                                Tahrirlash
                                                            </Link>
                                                        </div>
                                                        <Link
                                                            href={`/elon/${listing.id}/tolov`}
                                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                                        >
                                                            <Megaphone className="w-3.5 h-3.5" />
                                                            Reklama qilish
                                                        </Link>
                                                    </>
                                                )}

                                                {/* KUTAYOTGAN: Yakunlash + Tahrirlash */}
                                                {listing.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setDeactivateTarget({ id: listing.id, type: 'horses' })}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Yakunlash
                                                        </button>
                                                        <Link
                                                            href={`/elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* TO'LANMAGAN: Nashr to'lovi + Tahrirlash */}
                                                {!listing.isPaid && listing.status === 'DRAFT' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/elon/${listing.id}/nashr-tolov`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                                                        >
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                            To&apos;lov qilish
                                                        </Link>
                                                        <Link
                                                            href={`/elon/${listing.id}/edit`}
                                                            className="flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* NOFAOL: O'chirish + Tahrirlash */}
                                                {listing.status === 'ARCHIVED' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDeleteListing(listing.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            O&apos;chirish
                                                        </button>
                                                        <Link
                                                            href={`/elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* RAD ETILGAN: sabab + Tahrirlash + Qayta yuborish */}
                                                {listing.status === 'REJECTED' && listing.rejectReason && (
                                                    <div className="mb-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">Rad etish sababi:</p>
                                                        <p className="text-xs text-red-600 dark:text-red-400">{listing.rejectReason}</p>
                                                    </div>
                                                )}
                                                {listing.status === 'REJECTED' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                        <button
                                                            onClick={() => handleResubmit(listing.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                            Faollashtirish
                                                        </button>
                                                    </div>
                                                )}

                                                {/* MUDDATI TUGAGAN: Tahrirlash + Faollashtirish (to'lov orqali) */}
                                                {listing.status === 'EXPIRED' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                        <button
                                                            onClick={() => handleReactivationPayment(listing.id)}
                                                            disabled={reactivatingId === listing.id || loadingPrice}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
                                                        >
                                                            {(reactivatingId === listing.id || loadingPrice)
                                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                : <RefreshCw className="w-3.5 h-3.5" />}
                                                            Faollashtirish
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Sahifa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${p === currentPage ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'}`}>
                                                {p}
                                            </button>
                                        ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Empty state */
                        <div className="text-center py-16 sm:py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                            {(() => { const { Icon, color } = getEmptyState(); return <Icon className={`w-16 h-16 mx-auto mb-4 ${color}`} />; })()}
                            <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">{getEmptyState().title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">{getEmptyState().desc}</p>
                            {(statusFilter === 'inactive' || listings.length === 0) && (
                                <Link href="/elon/yaratish" className="btn btn-primary">
                                    <Plus className="w-5 h-5" /> Ot e&apos;loni yaratish
                                </Link>
                            )}
                        </div>
                    )
                ) : mainTab === 'sheep' ? (
                    /* ── SHEEP CONTENT ── */
                    filteredSheepListings.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {(paginatedItems as Listing[]).map((listing) => (
                                    <div key={listing.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col">

                                        {/* Image */}
                                        <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                                            {listing.media[0] ? (
                                                <Image
                                                    src={listing.media[0].thumbUrl || listing.media[0].url}
                                                    alt={listing.title}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-4xl">🐑</div>
                                            )}

                                            {/* Status badge */}
                                            <div className="absolute top-2 left-2">
                                                {getListingStatusBadge(listing)}
                                            </div>

                                            {/* 3-dot menu */}
                                            {listing.status !== 'PENDING' && (
                                                <div className="absolute top-2 right-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === listing.id ? null : listing.id);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {openMenuId === listing.id && (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1"
                                                        >
                                                            {listing.status === 'APPROVED' && (
                                                                <button
                                                                    onClick={async () => {
                                                                        const url = `${window.location.origin}/qoy/${listing.slug}`;
                                                                        try {
                                                                            if (navigator.share) await navigator.share({ title: listing.title, url });
                                                                            else await navigator.clipboard.writeText(url);
                                                                        } catch { }
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                                >
                                                                    <Share2 className="w-4 h-4" />
                                                                    Ulashish
                                                                </button>
                                                            )}
                                                            {(listing.status === 'DRAFT' || listing.status === 'REJECTED') && (
                                                                <Link
                                                                    href={`/qoy-elon/${listing.id}/edit`}
                                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                                    onClick={() => setOpenMenuId(null)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Tahrirlash
                                                                </Link>
                                                            )}
                                                            {(listing.status === 'APPROVED' || listing.status === 'EXPIRED' || listing.status === 'DRAFT') && (
                                                                <button
                                                                    onClick={() => { setDeactivateTarget({ id: listing.id, type: 'sheep' }); setOpenMenuId(null); }}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                                >
                                                                    <Archive className="w-4 h-4" />
                                                                    Nofaol qilish
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Card body */}
                                        <div className="p-3 flex flex-col flex-1">
                                            {/* Dates */}
                                            {listing.status === 'APPROVED' && listing.publishedAt ? (
                                                <div className="flex items-center justify-between text-xs mb-1.5 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg px-2 py-1">
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {formatDate(listing.publishedAt)}
                                                    </span>
                                                    {listing.expiresAt && (
                                                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(listing.expiresAt)} gacha
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
                                                    <span>{listing.createdAt ? formatDate(listing.createdAt) : ''}</span>
                                                    {listing.expiresAt && listing.status === 'EXPIRED' && (
                                                        <span className="text-amber-500 dark:text-amber-400">
                                                            tugdi: {formatDate(listing.expiresAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Title */}
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 line-clamp-2 leading-snug">
                                                {listing.title}
                                            </h3>

                                            {/* Price */}
                                            <p className="text-base font-bold text-primary-600 dark:text-primary-400 mb-2">
                                                {Number(listing.priceAmount).toLocaleString()} {listing.priceCurrency}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {listing.viewCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3.5 h-3.5" />
                                                    {listing.favoriteCount ?? 0}
                                                </span>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="mt-auto space-y-2">

                                                {/* FAOL */}
                                                {listing.status === 'APPROVED' && (
                                                    <>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setDeactivateTarget({ id: listing.id, type: 'sheep' })}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Yakunlash
                                                            </button>
                                                            <Link
                                                                href={`/qoy-elon/${listing.id}/edit`}
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                                Tahrirlash
                                                            </Link>
                                                        </div>
                                                        <Link
                                                            href={`/qoy-elon/${listing.id}/tolov`}
                                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                                        >
                                                            <Megaphone className="w-3.5 h-3.5" />
                                                            Reklama qilish
                                                        </Link>
                                                    </>
                                                )}

                                                {/* KUTAYOTGAN */}
                                                {listing.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setDeactivateTarget({ id: listing.id, type: 'sheep' })}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Yakunlash
                                                        </button>
                                                        <Link
                                                            href={`/qoy-elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* TO'LANMAGAN */}
                                                {!listing.isPaid && listing.status === 'DRAFT' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/qoy-elon/${listing.id}/nashr-tolov`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                                                        >
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                            To&apos;lov qilish
                                                        </Link>
                                                        <Link
                                                            href={`/qoy-elon/${listing.id}/edit`}
                                                            className="flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* NOFAOL */}
                                                {listing.status === 'ARCHIVED' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm("E'lonni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.")) return;
                                                                try {
                                                                    await fetch(`${apiBase}/api/my/sheep-listings/${listing.id}/permanent`, { method: 'DELETE', credentials: 'include' });
                                                                    await fetchSheepListings();
                                                                } catch (e) { console.error(e); }
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            O&apos;chirish
                                                        </button>
                                                        <Link
                                                            href={`/qoy-elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* RAD ETILGAN */}
                                                {listing.status === 'REJECTED' && listing.rejectReason && (
                                                    <div className="mb-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">Rad etish sababi:</p>
                                                        <p className="text-xs text-red-600 dark:text-red-400">{listing.rejectReason}</p>
                                                    </div>
                                                )}
                                                {listing.status === 'REJECTED' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/qoy-elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await fetch(`${apiBase}/api/my/sheep-listings/${listing.id}/submit`, { method: 'POST', credentials: 'include' });
                                                                    if (res.status === 402) {
                                                                        const body = await res.json();
                                                                        router.push(`/qoy-elon/${body.listingId || listing.id}/nashr-tolov`);
                                                                        return;
                                                                    }
                                                                    if (res.ok) await fetchSheepListings();
                                                                } catch (e) { console.error(e); }
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                            Faollashtirish
                                                        </button>
                                                    </div>
                                                )}

                                                {/* MUDDATI TUGAGAN */}
                                                {listing.status === 'EXPIRED' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={`/qoy-elon/${listing.id}/edit`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                            Tahrirlash
                                                        </Link>
                                                        <button
                                                            onClick={() => handleReactivationPayment(listing.id)}
                                                            disabled={reactivatingId === listing.id || loadingPrice}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
                                                        >
                                                            {(reactivatingId === listing.id || loadingPrice)
                                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                : <RefreshCw className="w-3.5 h-3.5" />}
                                                            Faollashtirish
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Sahifa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${p === currentPage ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'}`}>{p}</button>
                                        ))}
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16 sm:py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <div className="text-6xl mb-4">🐑</div>
                            <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">Qo&apos;y/Echki e&apos;lonlar yo&apos;q</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Hali hech qanday e&apos;lon yaratmadingiz</p>
                            <Link href="/qoy-elon/yaratish" className="btn btn-primary">
                                <Plus className="w-5 h-5" /> E&apos;lon yaratish
                            </Link>
                        </div>
                    )
                ) : (
                    /* ── PRODUCTS CONTENT ── */
                    filteredProducts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {(paginatedItems as Product[]).map((product) => (
                                    <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col">
                                        <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700">
                                            {product.media[0] ? (
                                                <Image src={product.media[0].thumbUrl || product.media[0].url} alt={product.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                    <Package className="w-14 h-14" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2">
                                                {(() => {
                                                    if (!product.isPaid) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white">To&apos;lanmagan</span>;
                                                    if (product.status === 'DRAFT') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">Kutilayotgan</span>;
                                                    if (product.status === 'PUBLISHED') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">Faol</span>;
                                                    if (product.status === 'ARCHIVED') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">Bekor qilingan</span>;
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="p-3 flex flex-col flex-1">
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{formatDate(product.createdAt)}</p>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 line-clamp-2 leading-snug">{product.title}</h3>
                                            <p className="text-base font-bold text-primary-600 dark:text-primary-400 mb-2">
                                                {product.priceAmount.toLocaleString()} {product.priceCurrency}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mb-3">
                                                <Eye className="w-3.5 h-3.5" />{product.viewCount}
                                            </div>
                                            {product.category && (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-3">
                                                    {product.category.name}
                                                </span>
                                            )}
                                            <div className="mt-auto space-y-2">
                                                {/* TO'LANMAGAN: To'lov + Tahrirlash icon + Delete icon */}
                                                {!product.isPaid && (
                                                    <div className="flex gap-2">
                                                        <Link href={`/mahsulot/${product.id}/tolov`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                            To&apos;lov qilish
                                                        </Link>
                                                        <Link href={`/mahsulot/${product.id}/tahrir`} className="flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </Link>
                                                        <button onClick={() => handleDeleteProduct(product.id)} className="flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {/* FAOL: Ko'rish + Tahrirlash, keyin Ulashish + O'chirish */}
                                                {product.isPaid && product.status === 'PUBLISHED' && (
                                                    <>
                                                        <div className="flex gap-2">
                                                            <Link href={`/mahsulotlar/${product.slug}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                                <Eye className="w-3.5 h-3.5" /> Ko&apos;rish
                                                            </Link>
                                                            <Link href={`/mahsulot/${product.id}/tahrir`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                                <Edit className="w-3.5 h-3.5" /> Tahrirlash
                                                            </Link>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleShareProduct(product)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                                <Share2 className="w-3.5 h-3.5" /> Ulashish
                                                            </button>
                                                            <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" /> O&apos;chirish
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                                {/* KUTILAYOTGAN yoki ARXIV: Tahrirlash + O'chirish */}
                                                {product.isPaid && (product.status === 'DRAFT' || product.status === 'ARCHIVED') && (
                                                    <div className="flex gap-2">
                                                        <Link href={`/mahsulot/${product.id}/tahrir`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                            <Edit className="w-3.5 h-3.5" /> Tahrirlash
                                                        </Link>
                                                        <button onClick={() => handleDeleteProduct(product.id)} className="flex items-center justify-center px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${p === currentPage ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{p}</button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16 sm:py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <Package className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                            <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2">
                                {productFilter === 'PUBLISHED' && "Faol mahsulotlar yo'q"}
                                {productFilter === 'DRAFT' && "Kutilayotgan mahsulotlar yo'q"}
                                {productFilter === 'ARCHIVED' && "Bekor qilingan mahsulotlar yo'q"}
                                {productFilter === 'UNPAID' && "To'lanmagan mahsulotlar yo'q"}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Birinchi mahsulotingizni yarating va sotishni boshlang</p>
                            <Link href="/mahsulot/yaratish" className="btn btn-primary">
                                <Plus className="w-5 h-5" /> Mahsulot yaratish
                            </Link>
                        </div>
                    )
                )}
            </div>

            {/* ── DEACTIVATE MODAL ── */}
            {deactivateListingId && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setDeactivateTarget(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                            E&apos;loningiz muvaffaqiyatli bo&apos;ldimi?
                        </h3>
                        {deactivateListing && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 line-clamp-1">
                                {deactivateListing.title}
                            </p>
                        )}
                        <div className="space-y-2">
                            <button
                                onClick={() => handleDeactivate(deactivateListingId, 'OTBOZOR')}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium hover:border-green-400 dark:hover:border-green-600 transition-colors text-left"
                            >
                                <span className="text-xl leading-none">✅</span>
                                <span>Ha, {deactivateTarget?.type === 'sheep' ? 'Chorva' : 'Otbozor'}&apos;da sotildi</span>
                            </button>
                            <button
                                onClick={() => handleDeactivate(deactivateListingId, 'OTHER')}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:border-slate-400 dark:hover:border-slate-500 transition-colors text-left"
                            >
                                <span className="text-xl leading-none">🔄</span>
                                <span>Yo&apos;q, boshqa joyda sotildi</span>
                            </button>
                            <button
                                onClick={() => setDeactivateTarget(null)}
                                className="w-full px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Yo&apos;q (bekor qilish)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REACTIVATION PRICE MODAL ── */}
            {reactivationModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setReactivationModal(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RefreshCw className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 text-center">
                            E&apos;lonni faollashtirish
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 text-center">
                            Muddati tugagan e&apos;lonni qayta faollashtirish uchun to&apos;lov amalga oshiriladi
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 flex items-center justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">To&apos;lov summasi:</span>
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                {reactivationModal.price.toLocaleString('uz-UZ')} so&apos;m
                            </span>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={handleConfirmReactivation}
                                disabled={!!reactivatingId}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors"
                            >
                                {reactivatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                To&apos;lov qilish
                            </button>
                            <button
                                onClick={() => setReactivationModal(null)}
                                className="w-full py-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MyListingsPage() {
    return (
        <RequireAuth redirectTo="/profil/elonlarim">
            <MyListingsPageContent />
        </RequireAuth>
    );
}
