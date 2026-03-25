import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSheepListings, SheepListingsFilter, SheepListing } from '@/lib/api';
import { QoyFilters } from './QoyFilters';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { MapPin, Clock, Crown, Video, Search, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Qo'y & Echki bozori",
    description: "O'zbekiston bo'ylab sotiladigan qo'y va echkilar ro'yxati.",
};

function SheepCard({ listing }: { listing: SheepListing }) {
    const mainImage = listing.media?.[0]?.thumbUrl || listing.media?.[0]?.url || null;

    return (
        <Link
            href={`/qoy/${listing.slug}`}
            className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 block"
        >
            <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700 overflow-hidden">
                {mainImage ? (
                    <Image src={mainImage} alt={listing.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                        {listing.animalType === 'ECHKI' ? '🐐' : '🐑'}
                    </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                    {listing.isPremium && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm">
                            <Crown className="w-3 h-3" /> Premium
                        </span>
                    )}
                    {listing.hasVideo && (
                        <span className="badge bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
                            <Video className="w-3 h-3" /> Video
                        </span>
                    )}
                </div>
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${listing.animalType === 'ECHKI' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {listing.animalType === 'ECHKI' ? 'Echki' : "Qo'y"}
                    </span>
                </div>
            </div>
            <div className="p-3">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 text-sm md:text-base group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors mb-1">
                    {listing.title}
                </h3>
                <p className="text-lg font-bold text-primary-600 mb-2">
                    {formatPrice(listing.priceAmount, listing.priceCurrency)}
                </p>
                <div className="flex flex-wrap gap-1 text-xs text-slate-500 mb-2">
                    {listing.ageMonths && (
                        <span className="bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                            {listing.ageMonths >= 12 ? `${Math.floor(listing.ageMonths / 12)} yosh` : `${listing.ageMonths} oy`}
                        </span>
                    )}
                    {listing.breed && (
                        <span className="bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">{listing.breed.name}</span>
                    )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{listing.region.nameUz}</span>
                    </span>
                    {listing.publishedAt && (
                        <span className="flex items-center gap-1 flex-shrink-0 ml-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(listing.publishedAt)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default async function QoyBozorPage({ searchParams }: { searchParams: SheepListingsFilter }) {
    const result = await getSheepListings(searchParams).catch(() => ({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }));
    const listings = result.data || [];
    const pagination = result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                {/* Sidebar */}
                <aside className="hidden lg:block w-1/4 flex-shrink-0">
                    <Suspense fallback={<div className="bg-white dark:bg-slate-800 rounded-xl h-64 animate-pulse" />}>
                        <QoyFilters />
                    </Suspense>
                </aside>

                {/* Main */}
                <div className="w-full lg:w-3/4 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                            Qo&apos;y & Echki <span className="text-slate-500 text-base font-normal">({pagination.total})</span>
                        </h1>
                        <Link href="/qoy-elon/yaratish" className="btn btn-primary flex items-center gap-2 text-sm">
                            <Plus className="w-4 h-4" />
                            E&apos;lon joylash
                        </Link>
                    </div>

                    {listings.length > 0 ? (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                            {listings.map((listing) => (
                                <SheepCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                            <div className="bg-white dark:bg-slate-700 p-4 rounded-full inline-block shadow-sm mb-4">
                                <Search className="w-8 h-8 text-slate-400 dark:text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">E&apos;lonlar topilmadi</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
                                Hozircha e'lonlar yo'q. Birinchi bo'ling!
                            </p>
                            <Link href="/qoy-elon/yaratish" className="btn btn-primary">
                                E&apos;lon joylash
                            </Link>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                <Link key={p} href={`/qoy-bozor?page=${p}`}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${p === pagination.page ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {p}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
