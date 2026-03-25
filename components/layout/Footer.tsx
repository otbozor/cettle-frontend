import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto pb-20 md:pb-0">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                    {/* Brand + Contact */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Image src="/logo.png" alt="Chorvabozor" width={36} height={36} className="object-contain" />
                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                Ot<span className="text-primary-600 dark:text-primary-400">bozor</span>
                            </span>
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            O'zbekistondagi eng ishonchli chorva savdo platformasi.
                        </p>

                        {/* Contact info */}
                        <div className="flex flex-col gap-3 text-sm">
                            <a href="tel:+998973027750" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                +998 97 302 77 50
                            </a>
                            <a href="mailto:otbozor.rasmiy@gmail.com" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                otbozor.rasmiy@gmail.com
                            </a>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/bozor" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    Mol bozori
                                </Link>
                            </li>
                            <li>
                                <Link href="/qoy-bozor" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    Qo&apos;y & Echki
                                </Link>
                            </li>
                            <li>
                                <Link href="/mahsulotlar" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    Mahsulotlar
                                </Link>
                            </li>
                            <li>
                                <Link href="/elon/yaratish" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    E'lon joylash
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-semibold mb-4 text-sm uppercase tracking-wider">Kompaniya</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/blog" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/aloqa" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    Aloqa
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    Foydalanish shartlari
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    Maxfiylik siyosati
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-semibold mb-4 text-sm uppercase tracking-wider">Ijtimoiy tarmoqlar</h3>
                        <div className="flex flex-col gap-3 text-sm">
                            <a
                                href="https://t.me/otbozor_rasmiy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                            >
                                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-50 dark:group-hover:bg-sky-500/20 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                    </svg>
                                </span>
                                Telegram kanal
                            </a>
                            <a
                                href="https://t.me/otbozor_rasmiy_guruh"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                            >
                                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-50 dark:group-hover:bg-sky-500/20 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.18 13.842 3.27 12.94c-.643-.204-.657-.643.136-.953l10.868-4.19c.537-.194 1.006.131.833.95" />
                                    </svg>
                                </span>
                                Telegram guruh
                            </a>
                            <a
                                href="https://www.instagram.com/otbozor.uz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                            >
                                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-pink-50 dark:group-hover:bg-pink-500/20 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                    </svg>
                                </span>
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <p>© {new Date().getFullYear()} Chorvabozor. Barcha huquqlar himoyalangan.</p>
                    <div className="flex gap-5">
                        <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            Foydalanish shartlari
                        </Link>
                        <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            Maxfiylik siyosati
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
