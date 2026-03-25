import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowRight, CheckCircle2 } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative min-h-[88vh] flex items-center bg-white dark:bg-slate-950 overflow-hidden">

            <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 relative z-10 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-full text-sm text-primary-700 dark:text-primary-300 font-medium mb-5">
                            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                            O'zbekistondagi #1 raqamli chorva savdo platformasi
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-slate-900 dark:text-white leading-tight mb-6">
                            Chorva savdosi uchun{' '}
                            <span className="text-primary-600 dark:text-primary-400">yagona onlayn</span>{' '}
                            platforma
                        </h1>

                        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                            Bozor narxlari, real e'lonlar va to'g'ridan-to'g'ri aloqa.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-10">
                            <Link
                                href="/bozor"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-base transition-colors shadow-lg shadow-primary-500/20"
                            >
                                <Search className="w-5 h-5" />
                                Mol qidirish
                            </Link>
                            <Link
                                href="/elon/yaratish"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold text-base transition-colors"
                            >
                                E'lon joylash
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                Tekshirilgan mollar
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                Xavfsiz to'lov
                            </div>
                        </div>
                    </div>

                    {/* Right - Cattle image */}
                    <div className="hidden lg:flex justify-center">
                        <Image
                            src="/group.jpg"
                            alt="Mol"
                            width={600}
                            height={450}
                            className="w-full max-w-md rounded-2xl object-contain"
                            priority
                        />
                    </div>

                </div>
            </div>
        </section>
    );
}
