import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSheepListing } from '@/lib/api';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { MapPin, Clock, CheckCircle, Phone, MessageCircle, Eye, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function QoyDetailPage({ params }: { params: { slug: string } }) {
    const listing = await getSheepListing(params.slug).catch(() => null);
    if (!listing) notFound();

    const purposeMap: Record<string, string> = {
        GOSHT: "Go'sht uchun", JUN: 'Jun uchun', SUT: 'Sut uchun',
        NASLCHILIK: 'Naslchilik', OMIXTA: 'Omixta',
    };
    const genderMap: Record<string, string> = { URGOCHI: "Urg'ochi", ERKAK: 'Erkak' };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
            <Link href="/qoy-bozor" className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Qo&apos;y & Echki bozoriga qaytish
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Images */}
                <div className="lg:col-span-2">
                    <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden mb-3">
                        {listing.media?.[0] ? (
                            <Image src={listing.media[0].url} alt={listing.title} fill className="object-cover" priority />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">
                                {listing.animalType === 'ECHKI' ? '🐐' : '🐑'}
                            </div>
                        )}
                        <div className="absolute top-3 left-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${listing.animalType === 'ECHKI' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                {listing.animalType === 'ECHKI' ? 'Echki' : "Qo'y"}
                            </span>
                        </div>
                    </div>
                    {listing.media?.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {listing.media.slice(1, 5).map((m, i) => (
                                <div key={i} className="relative aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                                    <Image src={m.thumbUrl || m.url} alt={`${listing.title} ${i + 2}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{listing.title}</h1>
                        <p className="text-2xl font-bold text-primary-600 mb-4">
                            {formatPrice(listing.priceAmount, listing.priceCurrency)}
                        </p>

                        <div className="space-y-2 text-sm">
                            {listing.breed && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Zoti</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{listing.breed.name}</span>
                                </div>
                            )}
                            {listing.gender && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Jinsi</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{genderMap[listing.gender] || listing.gender}</span>
                                </div>
                            )}
                            {listing.purpose && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Maqsad</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{purposeMap[listing.purpose] || listing.purpose}</span>
                                </div>
                            )}
                            {listing.ageMonths && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Yoshi</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {listing.ageMonths >= 12 ? `${Math.floor(listing.ageMonths / 12)} yosh` : `${listing.ageMonths} oy`}
                                    </span>
                                </div>
                            )}
                            {listing.hasVaccine && (
                                <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Emlangan</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <MapPin className="w-3 h-3" />
                            {listing.region.nameUz}{listing.district ? `, ${listing.district.nameUz}` : ''}
                            <span className="ml-auto flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {listing.viewCount}
                            </span>
                        </div>
                    </div>

                    {/* Seller */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 font-bold">
                                {listing.user.displayName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                    {listing.user.displayName}
                                    {listing.user.isVerified && <CheckCircle className="w-4 h-4 text-primary-500" />}
                                </p>
                                <p className="text-xs text-slate-400">Sotuvchi</p>
                            </div>
                        </div>
                        {listing.user.phone && (
                            <a href={`tel:${listing.user.phone}`} className="btn btn-primary w-full flex items-center justify-center gap-2 mb-2">
                                <Phone className="w-4 h-4" /> Qo&apos;ng&apos;iroq
                            </a>
                        )}
                        {listing.user.telegramUsername && (
                            <a href={`https://t.me/${listing.user.telegramUsername}`} target="_blank" rel="noopener noreferrer"
                                className="btn btn-outline w-full flex items-center justify-center gap-2">
                                <MessageCircle className="w-4 h-4" /> Telegram
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            {listing.description && (
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Tavsif</h2>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{listing.description}</p>
                </div>
            )}
        </div>
    );
}
