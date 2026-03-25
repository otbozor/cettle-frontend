const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

// Try to refresh access token using the refresh token cookie
// Concurrent callers share the same promise to avoid multiple refresh calls
let refreshPromise: Promise<boolean> | null = null;
async function tryRefreshToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            return res.ok;
        } catch {
            return false;
        } finally {
            refreshPromise = null;
        }
    })();
    return refreshPromise;
}

export async function apiFetch<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { params, ...init } = options;

    let url = `${API_BASE}${endpoint}`;

    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    const isAuthEndpoint = endpoint.includes('/auth/');

    const hasRevalidate = (init as any)?.next?.revalidate !== undefined;

    const doFetch = () =>
        fetch(url, {
            ...init,
            ...(hasRevalidate ? {} : { cache: init.cache ?? 'no-store' }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...init.headers,
            },
        });

    let response = await doFetch();

    // On 401, try to refresh token cookie and retry once
    if (response.status === 401 && !isAuthEndpoint) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            response = await doFetch();
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            const errorBody = await response.json().catch(() => ({}));
            return { success: false, message: errorBody.message || 'Unauthorized' } as T;
        }

        const error = await response.json().catch(() => ({}));
        const errorMessage = error.message || `HTTP ${response.status}`;
        console.error(`API Error [${response.status}]:`, errorMessage);
        throw new Error(errorMessage);
    }

    return response.json();
}

// Listings
export interface Listing {
    id: string;
    title: string;
    slug: string;
    description?: string;
    priceAmount: number;
    priceCurrency: 'UZS' | 'USD';
    ageYears?: number;
    gender?: string;
    purpose?: string;
    color?: string;
    hasPassport: boolean;
    hasVaccine?: boolean;
    hasVideo: boolean;
    isTop?: boolean;
    isPaid?: boolean;
    isPremium?: boolean;
    viewCount: number;
    favoriteCount: number;
    status: string;
    publishedAt?: string;
    createdAt?: string;
    region: { nameUz: string; slug: string };
    district?: { nameUz: string; slug: string };
    breed?: { name: string; slug: string };
    user: {
        id: string;
        displayName: string;
        telegramUsername?: string;
        phone?: string;
        isVerified: boolean;
        avatarUrl?: string;
    };
    media: Array<{
        id: string;
        url: string;
        thumbUrl?: string;
        type: 'IMAGE' | 'VIDEO';
    }>;
}

export interface ListingsResponse {
    data: Listing[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ListingsFilter {
    regionId?: string;
    districtId?: string;
    breedId?: string;
    purpose?: string;
    gender?: string;
    priceMin?: number;
    priceMax?: number;
    ageMin?: number;
    ageMax?: number;
    hasPassport?: boolean;
    hasVaccine?: boolean;
    hasVideo?: boolean;
    q?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

export async function getListings(filter: ListingsFilter = {}): Promise<ListingsResponse> {
    const response = await apiFetch<AuthResponse<ListingsResponse>>('/api/listings', { params: filter as any, next: { revalidate: 60 } } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
}

export async function getListing(idOrSlug: string): Promise<Listing> {
    // Try to fetch by ID or slug
    const response = await apiFetch<AuthResponse<Listing>>(`/api/listings/${idOrSlug}`, {
        next: { revalidate: 60 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error('Listing not found');
}

export async function getFeaturedListings(limit = 50): Promise<Listing[]> {
    // Ensure limit doesn't exceed 50
    const safeLimit = Math.min(limit, 50);
    const response = await apiFetch<AuthResponse<Listing[]>>('/api/listings/featured', {
        params: { limit: safeLimit },
        next: { revalidate: 60 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return [];
}

export async function getSimilarListings(id: string): Promise<Listing[]> {
    const response = await apiFetch<AuthResponse<Listing[]>>(`/api/listings/${id}/similar`, {
        next: { revalidate: 120 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return [];
}

// Regions
export interface Region {
    id: string;
    nameUz: string;
    nameRu?: string;
    slug: string;
    districts?: District[];
}

export interface District {
    id: string;
    nameUz: string;
    nameRu?: string;
    slug: string;
}

export async function getRegions(): Promise<Region[]> {
    const response = await apiFetch<AuthResponse<Region[]>>('/api/regions', {
        next: { revalidate: 3600 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return [];
}

export async function getRegionsWithDistricts(): Promise<Region[]> {
    const response = await apiFetch<AuthResponse<Region[]>>('/api/regions/with-districts', {
        next: { revalidate: 3600 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return [];
}

// Breeds
export interface Breed {
    id: string;
    name: string;
    slug: string;
}

export async function getBreeds(): Promise<Breed[]> {
    const response = await apiFetch<AuthResponse<Breed[]>>('/api/breeds', {
        next: { revalidate: 3600 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return [];
}

// Events
export interface KopkariEvent {
    id: string;
    title: string;
    slug: string;
    description?: string;
    startsAt: string;
    endsAt?: string;
    region: { nameUz: string; slug: string };
    district?: { nameUz: string; slug: string };
    addressText?: string;
    mapUrl?: string;
    organizerName: string;
    contactTelegram?: string;
    prizePool?: string;
    rules?: string;
    viewCount?: number;
}

export async function getUpcomingEvents(limit = 6): Promise<KopkariEvent[]> {
    // Ensure limit doesn't exceed 50
    const safeLimit = Math.min(limit, 50);
    const response = await apiFetch<AuthResponse<KopkariEvent[]>>('/api/events/upcoming', {
        params: { limit: safeLimit },
        next: { revalidate: 300 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return [];
}

export async function getAllPublicEvents(): Promise<KopkariEvent[]> {
    const response = await apiFetch<AuthResponse<KopkariEvent[]>>('/api/events', {
        next: { revalidate: 300 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    return [];
}

export async function getEvent(slug: string): Promise<KopkariEvent> {
    const response = await apiFetch<AuthResponse<KopkariEvent>>(`/api/events/${slug}`, {
        next: { revalidate: 300 },
    } as any);
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error('Event not found');
}

// User listings
export async function createListingDraft(data: any): Promise<Listing> {
    const response = await apiFetch<AuthResponse<Listing>>('/api/my/listings', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error(response.message || 'Failed to create listing');
}

export async function getMyListingById(id: string): Promise<Listing> {
    const response = await apiFetch<AuthResponse<Listing>>(`/api/my/listings/${id}`);
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error(response.message || 'Listing not found');
}

export async function updateListingDraft(id: string, data: any): Promise<Listing> {
    const response = await apiFetch<AuthResponse<Listing>>(`/api/my/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error(response.message || 'Failed to update listing');
}

export class PaymentRequiredError extends Error {
    listingId: string;
    price: number;
    constructor(listingId: string, price: number) {
        super('PAYMENT_REQUIRED');
        this.listingId = listingId;
        this.price = price;
    }
}

export async function submitListingForReview(id: string): Promise<Listing> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${API_BASE}/api/my/listings/${id}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (res.status === 402) {
        const body = await res.json();
        throw new PaymentRequiredError(body.listingId || id, body.price || 35000);
    }
    const response = await res.json();
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error(response.message || 'Failed to submit listing');
}

export async function createListingBundleInvoice(listingId: string, bundleSize: 5 | 10 | 20): Promise<{ paymentId: string; amount: number; clickUrl: string }> {
    const response = await apiFetch<AuthResponse<{ paymentId: string; amount: number; clickUrl: string }>>('/api/payments/create-listing-bundle-invoice', {
        method: 'POST',
        body: JSON.stringify({ listingId, bundleSize }),
    });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to create invoice');
}

export async function createCreditBundleInvoice(bundleSize: 5 | 10 | 20): Promise<{ paymentId: string; amount: number; clickUrl: string }> {
    const response = await apiFetch<AuthResponse<{ paymentId: string; amount: number; clickUrl: string }>>('/api/payments/create-credit-bundle-invoice', {
        method: 'POST',
        body: JSON.stringify({ bundleSize }),
    });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to create invoice');
}

// Media
export async function getSignedUploadUrl(
    entityType: string,
    contentType: string
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const response = await apiFetch<AuthResponse<{ uploadUrl: string; fileUrl: string; key: string }>>('/api/media/signed-url', {
        method: 'POST',
        body: JSON.stringify({ entityType, contentType }),
    });
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error(response.message || 'Failed to get upload URL');
}

export async function attachMediaToListing(
    listingId: string,
    media: Array<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }>
): Promise<void> {
    const response = await apiFetch<AuthResponse<void>>('/api/media/attach', {
        method: 'POST',
        body: JSON.stringify({ listingId, media }),
    });
    if (!response.success) {
        throw new Error(response.message || 'Failed to attach media');
    }
}

// Favorites
export async function addToFavorites(listingId: string): Promise<void> {
    const response = await apiFetch<AuthResponse<void>>(`/api/listings/${listingId}/favorite`, { method: 'POST' });
    if (!response.success) {
        throw new Error(response.message || 'Failed to add to favorites');
    }
}

export async function removeFromFavorites(listingId: string): Promise<void> {
    const response = await apiFetch<AuthResponse<void>>(`/api/listings/${listingId}/favorite`, { method: 'DELETE' });
    if (!response.success) {
        throw new Error(response.message || 'Failed to remove from favorites');
    }
}

export async function isFavorite(listingId: string): Promise<boolean> {
    const response = await apiFetch<AuthResponse<{ isFavorite: boolean }>>(`/api/listings/${listingId}/is-favorite`);
    return response.data?.isFavorite ?? false;
}

// Account
export async function deleteAccount(): Promise<void> {
    const response = await apiFetch<AuthResponse<null>>('/api/users/me', { method: 'DELETE' });
    if (!response.success) {
        throw new Error(response.message || 'Failed to delete account');
    }
}

// Auth
export interface AuthResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    timestamp: string;
}

export interface AdminLoginResponse {
    user: {
        id: string;
        username: string;
        displayName: string;
        isVerified: boolean;
        isAdmin: boolean;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
}

export interface UserMeResponse {
    id: string;
    username?: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
    phone?: string;
    isAdmin: boolean;
    listingCredits: number;
}

export async function adminLogin(username: string, password: string): Promise<AuthResponse<AdminLoginResponse>> {
    const response = await apiFetch<AuthResponse<AdminLoginResponse>>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    return response;
}

export async function startTelegramAuth(returnUrl?: string): Promise<AuthResponse<{ sessionId: string; botDeepLink: string; expiresIn: number }>> {
    return apiFetch('/api/auth/telegram/start', {
        method: 'POST',
        body: JSON.stringify({ returnUrl }),
    });
}

export async function verifyCode(code: string): Promise<AuthResponse<{ tokens: { accessToken: string; refreshToken: string; expiresIn: string } }>> {
    const response = await apiFetch<AuthResponse<{ tokens: { accessToken: string; refreshToken: string; expiresIn: string } }>>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });

    return response;
}

export async function refreshTokens(): Promise<AuthResponse<{ tokens: { accessToken: string; refreshToken: string; expiresIn: string } }>> {
    const response = await apiFetch<AuthResponse<{ tokens: { accessToken: string; refreshToken: string; expiresIn: string } }>>('/api/auth/refresh', {
        method: 'POST',
    });

    return response;
}

export async function getCurrentUser(): Promise<AuthResponse<UserMeResponse>> {
    return apiFetch('/api/auth/me');
}

export async function logout(): Promise<AuthResponse<null>> {
    return apiFetch('/api/auth/logout', { method: 'POST' });
}

// Payments
export async function getReactivationPrice(): Promise<number> {
    const response = await apiFetch<AuthResponse<{ amount: number }>>('/api/payments/reactivation-price');
    if (response.success && response.data) return response.data.amount;
    return 50000;
}

export async function createReactivationInvoice(
    listingId: string,
): Promise<{ paymentId: string; amount: number; clickUrl: string }> {
    const response = await apiFetch<AuthResponse<{ paymentId: string; amount: number; clickUrl: string }>>(
        '/api/payments/create-reactivation-invoice',
        { method: 'POST', body: JSON.stringify({ listingId }) },
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to create reactivation invoice');
}

export async function createPaymentInvoice(
    listingId: string,
    packageType: 'OSON_START' | 'TEZKOR_SAVDO' | 'TURBO_SAVDO',
): Promise<{ paymentId: string; amount: number; clickUrl: string }> {
    const response = await apiFetch<AuthResponse<{ paymentId: string; amount: number; clickUrl: string }>>(
        '/api/payments/create-invoice',
        { method: 'POST', body: JSON.stringify({ listingId, packageType }) },
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to create invoice');
}

export async function getPaymentStatus(paymentId: string): Promise<{
    id: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    amount: number;
    packageType: string;
    listing: { id: string; title: string; slug: string; isPaid: boolean };
}> {
    const response = await apiFetch<AuthResponse<any>>(`/api/payments/status/${paymentId}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Payment not found');
}

export async function createProductPaymentInvoice(
    productId: string,
): Promise<{ paymentId: string; amount: number; clickUrl: string }> {
    const response = await apiFetch<AuthResponse<{ paymentId: string; amount: number; clickUrl: string }>>(
        '/api/payments/create-product-invoice',
        { method: 'POST', body: JSON.stringify({ productId }) },
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to create invoice');
}

export async function getProductPaymentStatus(paymentId: string): Promise<{
    id: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    amount: number;
    product: { id: string; title: string; slug: string; isPaid: boolean };
}> {
    const response = await apiFetch<AuthResponse<any>>(`/api/payments/product-status/${paymentId}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Payment not found');
}

// ============================================
// SHEEP & GOAT LISTINGS
// ============================================

export interface SheepListing {
    id: string;
    title: string;
    slug: string;
    description?: string;
    animalType: 'QOY' | 'ECHKI';
    purpose?: string;
    gender?: string;
    ageMonths?: number;
    priceAmount: number;
    priceCurrency: 'UZS' | 'USD';
    hasVaccine?: boolean;
    hasVideo: boolean;
    isTop?: boolean;
    isPaid?: boolean;
    isPremium?: boolean;
    viewCount: number;
    favoriteCount: number;
    status: string;
    rejectReason?: string;
    expiresAt?: string;
    boostExpiresAt?: string;
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    region: { nameUz: string; slug: string };
    district?: { nameUz: string; slug: string };
    breed?: { name: string; slug: string };
    user: {
        id: string;
        displayName: string;
        telegramUsername?: string;
        phone?: string;
        isVerified: boolean;
        avatarUrl?: string;
    };
    media: Array<{ id?: string; url: string; thumbUrl?: string; type: 'IMAGE' | 'VIDEO' }>;
}

export interface SheepListingsFilter {
    animalType?: string;
    regionId?: string;
    districtId?: string;
    breedId?: string;
    purpose?: string;
    gender?: string;
    priceMin?: number;
    priceMax?: number;
    q?: string;
    sort?: string;
    page?: number;
    limit?: number;
}

export interface SheepBreed {
    id: string;
    name: string;
    slug: string;
    animalType: string;
}

export async function getSheepListings(filter: SheepListingsFilter = {}): Promise<{ data: SheepListing[]; pagination: any }> {
    const response = await apiFetch<AuthResponse<any>>('/api/sheep-listings', { params: filter as any, next: { revalidate: 60 } } as any);
    if (response.success && response.data) return response.data;
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
}

export async function getSheepListing(idOrSlug: string): Promise<SheepListing> {
    const response = await apiFetch<AuthResponse<SheepListing>>(`/api/sheep-listings/${idOrSlug}`, { next: { revalidate: 60 } } as any);
    if (response.success && response.data) return response.data;
    throw new Error('Listing not found');
}

export async function getSheepBreeds(animalType?: string): Promise<SheepBreed[]> {
    const response = await apiFetch<AuthResponse<SheepBreed[]>>('/api/sheep-breeds', {
        params: animalType ? { animalType } : undefined,
        next: { revalidate: 3600 },
    } as any);
    if (response.success && response.data) return response.data;
    return [];
}

export async function createSheepListingDraft(data: any): Promise<SheepListing> {
    const response = await apiFetch<AuthResponse<SheepListing>>('/api/my/sheep-listings', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to create sheep listing');
}

export async function updateSheepListingDraft(id: string, data: any): Promise<SheepListing> {
    const response = await apiFetch<AuthResponse<SheepListing>>(`/api/my/sheep-listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to update sheep listing');
}

export async function submitSheepListingForReview(id: string): Promise<SheepListing> {
    const response = await apiFetch<AuthResponse<SheepListing>>(`/api/my/sheep-listings/${id}/submit`, {
        method: 'POST',
    });
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Failed to submit sheep listing');
}

export async function getMySheepListings(status?: string): Promise<SheepListing[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiFetch<AuthResponse<SheepListing[]>>(`/api/my/sheep-listings${params}`);
    if (response.success && response.data) return response.data;
    return [];
}

export async function archiveSheepListing(id: string, saleSource?: string): Promise<void> {
    await apiFetch<AuthResponse<void>>(`/api/my/sheep-listings/${id}`, {
        method: 'DELETE',
        body: saleSource ? JSON.stringify({ saleSource }) : undefined,
    });
}

export async function deleteSheepListingPermanent(id: string): Promise<void> {
    await apiFetch<AuthResponse<void>>(`/api/my/sheep-listings/${id}/permanent`, {
        method: 'DELETE',
    });
}

export async function getMySheepListingById(id: string): Promise<SheepListing> {
    const response = await apiFetch<AuthResponse<SheepListing>>(`/api/my/sheep-listings/${id}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Listing not found');
}

export async function attachMediaToSheepListing(
    listingId: string,
    media: Array<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }>
): Promise<void> {
    const response = await apiFetch<AuthResponse<void>>('/api/media/attach', {
        method: 'POST',
        body: JSON.stringify({ sheepListingId: listingId, media }),
    });
    if (!response.success) {
        throw new Error(response.message || 'Failed to attach media');
    }
}
