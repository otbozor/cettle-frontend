import { notFound } from 'next/navigation';
import { getEvent } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MapPin, Calendar, Trophy, User, Phone, Navigation, ArrowLeft, Eye } from 'lucide-react';
import { HorseshoeIcon } from '@/components/icons/HorseIcons';
import ShareButton from './ShareButton';
import Link from 'next/link';
import { EventViewTracker } from '@/components/kopkari/EventViewTracker';

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
    let event;

    try {
        event = await getEvent(params.slug);
    } catch (error) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EventViewTracker slug={params.slug} />
            <div className="mb-4">
                <Link href="/kopkari" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    <ArrowLeft className="w-4 h-4" />
                    Orqaga
                </Link>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="relative h-48 md:h-64 bg-gradient-to-br from-amber-700 via-orange-700 to-red-800 flex items-end overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><HorseshoeIcon className="w-64 h-64 text-white" /></div>
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

                    <div className="relative z-10 p-6 md:p-8 w-full">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
                        <div className="flex flex-wrap gap-4 text-white/90">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-5 h-5 text-amber-400" />
                                {formatDate(event.startsAt)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-5 h-5 text-amber-400" />
                                {event.region.nameUz}{event.district?.nameUz ? `, ${event.district.nameUz}` : ''}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-5 h-5 text-amber-400" />
                                {event.viewCount ?? 0}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Tadbir haqida</h2>
                            <div
                                className="text-slate-600 dark:text-slate-300 leading-relaxed
                                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100
                                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100
                                    [&_p]:mb-3
                                    [&_strong]:font-bold
                                    [&_em]:italic
                                    [&_u]:underline
                                    [&_s]:line-through
                                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                                    [&_li]:mb-1
                                    [&_blockquote]:border-l-4 [&_blockquote]:border-amber-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:my-3"
                                dangerouslySetInnerHTML={{ __html: event.description || 'Tavsif mavjud emas' }}
                            />
                        </div>

                        {event.rules && (
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Qoidalar</h2>
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-4 rounded-xl text-amber-900 dark:text-amber-200">
                                    {event.rules}
                                </div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Xarita</h2>
                            {event.mapUrl && (event.mapUrl.includes('/maps/embed') || event.mapUrl.includes('output=embed')) ? (
                                <>
                                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                        <iframe
                                            src={event.mapUrl}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-2">
                                        <Navigation className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {event.addressText || `${event.region.nameUz}, ${event.district?.nameUz}`}
                                    </p>
                                </>
                            ) : (
                                <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                                    <p className="text-slate-500 dark:text-slate-400">Xarita mavjud emas</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {event.prizePool && (
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg shadow-amber-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Trophy className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="font-medium text-white/90">Umumiy sovrin jamg'armasi</span>
                                </div>
                                <p className="text-3xl font-bold">{event.prizePool}</p>
                            </div>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Tashkilotchi</h3>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white dark:bg-slate-600 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-500">
                                    <User className="w-5 h-5 text-slate-400 dark:text-slate-300" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-slate-100">{event.organizerName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Rasmiy tashkilotchi</p>
                                </div>
                            </div>

                            {event.contactTelegram && (
                                <a
                                    href={`https://t.me/${event.contactTelegram}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary w-full justify-center mb-3"
                                >
                                    <Phone className="w-4 h-4" />
                                    Bog'lanish
                                </a>
                            )}

                            <ShareButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
