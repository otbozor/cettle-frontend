import Link from 'next/link';
import Image from 'next/image';
import { Eye, MapPin, ChevronRight, Trophy, Calendar, FileText, ShoppingBag, Clock } from 'lucide-react';
import { getAllPublicEvents } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedSlider } from '@/components/home/FeaturedSlider';

async function getRecentListings() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/listings/featured?sort=newest&limit=10`, {
            next: { revalidate: 120 },
        });
        const data = await res.json();
        return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    } catch {
        return [];
    }
}

async function getRecentBlogPosts() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/blog/posts?page=1&limit=3`, {
            next: { revalidate: 300 },
        });
        const data = await res.json();
        return data.success ? (data.data || []) : [];
    } catch {
        return [];
    }
}

async function getRecentProducts() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products?limit=5&sort=newest`, {
            next: { revalidate: 120 },
        });
        const data = await res.json();
        return Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const [featuredListings, allEvents, recentPosts, recentProducts] = await Promise.all([
        getRecentListings(),
        getAllPublicEvents().catch(() => []),
        getRecentBlogPosts(),
        getRecentProducts(),
    ]);
    const upcomingEvents = allEvents.slice(0, 3);
    return (
      <div className="flex flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Featured Listings - Auto-scrolling slider */}
        <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Premium e'lonlar
                </h2>
              </div>
              <Link href="/bozor" className="btn btn-outline hidden md:flex">
                Barchasini ko'rish
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {featuredListings.length > 0 ? (
              <>
                <FeaturedSlider listings={featuredListings} />
                <div className="mt-8 text-center md:hidden">
                  <Link href="/bozor" className="btn btn-outline">
                    Barchasini ko'rish
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-14 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tez orada premium e'lonlar ko'rinadi
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Sotuvchilar e'lon joylagach bu yerda paydo bo'ladi
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Products */}
        <section className="py-12 md:py-16 bg-white dark:bg-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Mahsulotlar
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Ot jihozlari va aksessuarlar
                </p>
              </div>
              <Link
                href="/mahsulotlar"
                className="btn btn-outline hidden md:flex"
              >
                Barchasini ko'rish
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recentProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recentProducts.map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/mahsulotlar/${product.slug}`}
                      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col"
                    >
                      <div className="relative aspect-square bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        {product.media?.[0] ? (
                          <Image
                            src={
                              product.media[0].thumbUrl || product.media[0].url
                            }
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm line-clamp-2 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-base font-bold text-primary-600 dark:text-primary-400 mb-1">
                          {formatPrice(
                            product.priceAmount,
                            product.priceCurrency,
                          )}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
                          {product.category && (
                            <span className="truncate">
                              {product.category.name}
                            </span>
                          )}
                          {(product.publishedAt || product.createdAt) && (
                            <span className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                              <Clock className="w-3 h-3" />
                              {new Date(
                                product.publishedAt || product.createdAt,
                              ).toLocaleDateString("uz-UZ", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-8 text-center md:hidden">
                  <Link href="/mahsulotlar" className="btn btn-outline">
                    Barchasini ko'rish
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-14 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tez orada mahsulotlar ko'rinadi
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Sotuvchilar mahsulot qo'shgach bu yerda paydo bo'ladi
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Ko'pkari Events */}
        <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Ko'pkari
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  O'zbekiston bo'ylab ko'pkari tadbirlari
                </p>
              </div>
              <Link href="/kopkari" className="btn btn-outline hidden md:flex">
                Barchasini ko'rish
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/kopkari/${event.slug}`}
                    className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 card-hover group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-amber-500 rounded-xl flex flex-col items-center justify-center text-white">
                        <span className="text-xs font-medium">
                          {new Date(event.startsAt).toLocaleDateString(
                            "uz-UZ",
                            { month: "short" },
                          )}
                        </span>
                        <span className="text-xl font-bold">
                          {new Date(event.startsAt).getDate()}
                        </span>
                      </div>
                      {event.prizePool && (
                        <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                          {event.prizePool}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{event.region.nameUz}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-amber-500 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tez orada ko'pkari tadbirlari ko'rinadi
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Musobaqalar e'lon qilingach bu yerda paydo bo'ladi
                </p>
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div className="mt-8 text-center md:hidden">
                <Link href="/kopkari" className="btn btn-outline">
                  Barchasini ko'rish
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-12 md:py-16 bg-white dark:bg-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Blog
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Ot parvarishi va ko'pkari haqida maqolalar
                </p>
              </div>
              <Link href="/blog" className="btn btn-outline hidden md:flex">
                Barchasini ko'rish
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recentPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentPosts.map((post: any) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 card-hover"
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 overflow-hidden">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-primary-300 dark:text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.publishedAt).toLocaleDateString(
                            "uz-UZ",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.viewCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tez orada blog maqolalar ko'rinadi
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Maqolalar nashr etilgach bu yerda paydo bo'ladi
                </p>
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <Link href="/blog" className="btn btn-outline">
                Barchasini ko'rish
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
}
