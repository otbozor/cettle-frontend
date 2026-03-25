'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, User, Plus, LogOut, Heart, FileText, Shield } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';

const navigation = [
    { name: 'Mol bozori', href: '/bozor' },
    { name: "Qo'y & Echki", href: '/qoy-bozor' },
    { name: 'Mahsulotlar', href: '/mahsulotlar' },
    { name: 'Blog', href: '/blog' },
    { name: 'Aloqa', href: '/aloqa' },
];

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const pathname = usePathname();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Sahifa o'zgarganda menyuni yopish
    useEffect(() => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
    }, [pathname]);

    // Tashqariga bosganda user menyuni yopish
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [userMenuOpen]);

    // Mobile menu ochilganda scroll bloklash (pozitsiyani saqlab)
    useEffect(() => {
        if (mobileMenuOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [mobileMenuOpen]);

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

    const mobileMenu = mobileMenuOpen && mounted ? createPortal(
        <div className="lg:hidden fixed inset-0 top-16 z-[999] bg-white dark:bg-slate-900 overflow-y-auto">
            <div className="container mx-auto px-4 py-4">
                {/* User info */}
                {isAuthenticated && user && (
                    <div className="flex items-center gap-3 p-4 mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        {user.avatarUrl ? (
                            <Image src={user.avatarUrl} alt={user.displayName} width={40} height={40} className="rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                                {user.displayName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.displayName}</p>
                            {user.telegramUsername && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.telegramUsername}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation links */}
                <div className="space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                                isActive(item.href)
                                    ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                <hr className="my-4 border-slate-200 dark:border-slate-700" />

                {/* User actions */}
                {isAuthenticated ? (
                    <div className="space-y-1">
                        <Link href="/profil" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <User className="w-5 h-5 text-slate-400" /> Profil
                        </Link>
                        <Link href="/profil/elonlarim" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <FileText className="w-5 h-5 text-slate-400" /> Mening e&apos;lonlarim
                        </Link>
                        <Link href="/profil/sevimlilar" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <Heart className="w-5 h-5 text-slate-400" /> Sevimlilar
                        </Link>
                        {user?.isAdmin && (
                            <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <Shield className="w-5 h-5" /> Admin Panel
                            </Link>
                        )}

                        <hr className="my-4 border-slate-200 dark:border-slate-700" />

                        {/* Dark/Light mode toggle — hozircha yopiq
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Mavzu</span>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>
                        */}

                        <button
                            onClick={() => { setMobileMenuOpen(false); logout(); }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full"
                        >
                            <LogOut className="w-5 h-5" /> Chiqish
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Dark/Light mode toggle — hozircha yopiq
                        <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Mavzu</span>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>
                        */}

                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-base">
                            <User className="w-5 h-5" /> Kirish
                        </Link>
                        <Link href="/elon/yaratish" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl font-medium text-base">
                            <Plus className="w-5 h-5" /> E&apos;lon joylash
                        </Link>
                    </div>
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <header className="sticky top-0 z-[100] glass border-b border-slate-200/50 dark:border-slate-700/50">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                            <Image src="/logo.png" alt="Chorvabozor" width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                Ot<span className="text-primary-600 dark:text-primary-400">bozor</span>
                            </span>
                        </Link>

                        {/* Desktop navigation */}
                        <div className="hidden lg:flex items-center gap-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(item.href)
                                            ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
                                            : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* Desktop actions */}
                        <div className="hidden lg:flex items-center gap-2">
                            {/* Dark/Light mode toggle — hozircha yopiq
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            */}

                            {isAuthenticated ? (
                                <>
                                    <Link href="/elon/yaratish" className="btn btn-primary btn-sm">
                                        <Plus className="w-4 h-4" />
                                        E&apos;lon joylash
                                    </Link>

                                    <div className="relative" ref={userMenuRef}>
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            {user?.avatarUrl ? (
                                                <Image src={user.avatarUrl} alt={user.displayName} width={32} height={32} className="rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold">
                                                    {user?.displayName?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20">
                                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.displayName}</p>
                                                    {user?.telegramUsername && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.telegramUsername}</p>
                                                    )}
                                                </div>
                                                <div className="py-1">
                                                    <Link href="/profil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <User className="w-4 h-4" /> Profil
                                                    </Link>
                                                    <Link href="/profil/elonlarim" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <FileText className="w-4 h-4" /> Mening e&apos;lonlarim
                                                    </Link>
                                                    <Link href="/profil/sevimlilar" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <Heart className="w-4 h-4" /> Sevimlilar
                                                    </Link>
                                                    {user?.isAdmin && (
                                                        <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                            <Shield className="w-4 h-4" /> Admin Panel
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                                                    <button
                                                        onClick={logout}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full"
                                                    >
                                                        <LogOut className="w-4 h-4" /> Chiqish
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="btn btn-outline btn-sm">Kirish</Link>
                                    <Link href="/elon/yaratish" className="btn btn-primary btn-sm">
                                        <Plus className="w-4 h-4" />
                                        E&apos;lon joylash
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile right side */}
                        <div className="flex lg:hidden items-center gap-2">
                            {isAuthenticated && (
                                <Link href="/elon/yaratish" className="btn btn-primary btn-sm text-xs" style={{ padding: '6px 12px' }}>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">E&apos;lon</span>
                                </Link>
                            )}
                            <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Menu"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                                ) : (
                                    <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                                )}
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Mobile menu - portal orqali body ga chiqarildi */}
            {mobileMenu}
        </>
    );
}
