import { formatDate } from '@/lib/utils';
import { KopkariEvent } from '@/lib/api';
import { MapPin, Calendar, Trophy, ChevronRight, Plus } from 'lucide-react';
import { HorseshoeIcon } from '@/components/icons/HorseIcons';
import Link from 'next/link';
import { KopkariFilters } from './KopkariFilters';
import { Pagination } from '@/components/listing/Pagination';

const ITEMS_PER_PAGE = 12;

export const revalidate = 300;

async function getPublicEvents(regionId?: string, status?: string) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const params = new URLSearchParams();
        if (regionId) params.set('regionId', regionId);
        if (status === 'upcoming') params.set('upcoming', 'true');
        if (status === 'past') params.set('past', 'true');

        const res = await fetch(`${API_URL}/api/events?${params.toString()}`, { next: { revalidate: 300 } });
        const data = await res.json();
        if (data.success) {
            return Array.isArray(data.data) ? data.data : (data.data?.data || []);
        }
        return [];
    } catch {
        return [];
    }
}

async function getRegions() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/regions`, { next: { revalidate: 300 } });
        const data = await res.json();
        return data.success ? (data.data || []) : [];
    } catch {
        return [];
    }
}

export const metadata = {
    title: "Ko'pkari taqvimi - Barcha tadbirlar | Otbozor",
    description: "O'zbekistondagi barcha ko'pkari va ot musobaqalari taqvimi.",
};

export default async function KopkariPage({
    searchParams,
}: {
    searchParams: { regionId?: string; status?: string; page?: string };
}) {
    const [events, regions] = await Promise.all([
        getPublicEvents(searchParams.regionId, searchParams.status),
        getRegions(),
    ]);

    const currentPage = Math.max(1, Number(searchParams.page) || 1);
    const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
    const paginatedEvents = events.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Ko'pkari Taqvimi</h1>
                            <p className="text-amber-100 text-lg">Yaqinlashib kelayotgan ot choptirish musobaqalari</p>
                            <p className="text-amber-200 text-sm mt-1">{events.length} ta tadbir</p>
                        </div>
                        <a
                            href="https://t.me/doniyorjon_k"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 self-start bg-white text-amber-700 font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:bg-amber-50 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Ko&apos;pkari e&apos;loni joylash
                        </a>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <KopkariFilters
                    regions={regions}
                    currentRegionId={searchParams.regionId || ''}
                    currentStatus={searchParams.status || ''}
                />

                {/* Events grid */}
                {events.length > 0 ? (
                    <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {paginatedEvents.map((event: KopkariEvent) => {
                            const date = new Date(event.startsAt);
                            const isPast = date < new Date();
                            return (
                                <Link
                                    key={event.id}
                                    href={`/kopkari/${event.slug}`}
                                    className="group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700 transition-all flex gap-4 items-center"
                                >
                                    {/* Date Badge */}
                                    <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${
                                        isPast
                                            ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                                    }`}>
                                        <span className="text-[10px] font-bold uppercase leading-none">
                                            {date.toLocaleDateString('uz-UZ', { month: 'short' })}
                                        </span>
                                        <span className="text-2xl font-bold leading-tight">{date.getDate()}</span>
                                        <span className="text-[10px] leading-none">
                                            {date.toLocaleDateString('uz-UZ', { weekday: 'short' })}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 mb-1">
                                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                                                {event.title}
                                            </h3>
                                            {isPast && (
                                                <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-medium mt-0.5">
                                                    O'tgan
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {event.region.nameUz}{event.district && `, ${event.district.nameUz}`}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(event.startsAt)}
                                            </span>
                                        </div>
                                        {event.prizePool && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                                                <Trophy className="w-3 h-3" />
                                                {event.prizePool}
                                            </span>
                                        )}
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 flex-shrink-0 transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            searchParams={searchParams}
                            basePath="/kopkari"
                        />
                    )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="mb-4 flex justify-center"><HorseshoeIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" /></div>
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Tadbirlar topilmadi</h3>
                        <p className="text-slate-500 dark:text-slate-400">Boshqa filter tanlang</p>
                    </div>
                )}
            </div>
        </div>
    );
}
