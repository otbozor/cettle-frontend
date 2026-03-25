import { apiFetch, AuthResponse } from './api';

// Admin Dashboard Stats
export async function getAdminStats(): Promise<AuthResponse<{
    pendingListings: number;
    approvedListings: number;
    totalUsers: number;
    todayViews: number;
}>> {
    return apiFetch('/api/admin/dashboard/stats');
}

// All Listings with filters (admin)
export async function getAdminListings(options?: {
    status?: string;
    isPaid?: string;
    regionId?: string;
    saleSource?: string;
    page?: number;
    limit?: number;
}): Promise<any> {
    return apiFetch('/api/admin/listings', {
        params: {
            status: options?.status,
            isPaid: options?.isPaid,
            regionId: options?.regionId,
            saleSource: options?.saleSource,
            page: options?.page,
            limit: options?.limit,
        } as any,
    });
}

// Region stats for dashboard charts
export async function getRegionStats(): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/dashboard/region-stats');
}

// Pending Listings
export async function getPendingListings(page = 1, limit = 20): Promise<any> {
    const response = await apiFetch('/api/admin/listings/pending', {
        params: { page, limit },
    });
    console.log('getPendingListings response:', response);
    return response;
}

// Get Listing by ID (admin)
export async function getAdminListingById(id: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/listings/${id}`);
}

// Approve Listing
export async function approveListing(listingId: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/listings/${listingId}/approve`, {
        method: 'POST',
    });
}

// Delete Listing
export async function deleteAdminListing(listingId: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/listings/${listingId}`, {
        method: 'DELETE',
    });
}

// Reject Listing
export async function rejectListing(listingId: string, reason: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/listings/${listingId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

// Sheep Listings (admin)
export async function getAdminSheepListings(options?: {
    status?: string;
    regionId?: string;
    page?: number;
    limit?: number;
}): Promise<any> {
    return apiFetch('/api/admin/sheep-listings', {
        params: {
            status: options?.status,
            regionId: options?.regionId,
            page: options?.page,
            limit: options?.limit,
        } as any,
    });
}

export async function approveSheepListing(listingId: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/sheep-listings/${listingId}/approve`, { method: 'POST' });
}

export async function rejectSheepListing(listingId: string, reason: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/sheep-listings/${listingId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

export async function deleteAdminSheepListing(listingId: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/sheep-listings/${listingId}`, { method: 'DELETE' });
}

// Get Users
export async function getUsers(page = 1, limit = 20, status?: string): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/users', {
        params: { page, limit, status },
    });
}

// Ban User
export async function banUser(userId: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
    });
}

// Unban User
export async function unbanUser(userId: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
    });
}

// Audit Logs
export async function getAuditLogs(page = 1, limit = 50): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/audit-logs', {
        params: { page, limit },
    });
}

// Change Admin Password
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

// ---- Events (Ko'pkari) ----
export async function getAdminEvents(): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/events');
}

export async function createAdminEvent(data: any): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateAdminEvent(id: string, data: any): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function publishAdminEvent(id: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/events/${id}/publish`, { method: 'POST' });
}

export async function deleteAdminEvent(id: string): Promise<AuthResponse<any>> {
    return apiFetch(`/api/admin/events/${id}`, { method: 'DELETE' });
}

// Finance Settings
export interface ListingPackageSetting {
    price: number;
    discountPrice: number | null;
}
export interface FinanceSettings {
    productListingPrice: number;
    reactivationPrice: number;
    listingPackages: {
        OSON_START: ListingPackageSetting;
        TEZKOR_SAVDO: ListingPackageSetting;
        TURBO_SAVDO: ListingPackageSetting;
    };
    listingBundles: {
        bundle5: number;
        bundle10: number;
        bundle20: number;
    };
}

export async function getFinanceSettings(): Promise<AuthResponse<FinanceSettings>> {
    return apiFetch('/api/admin/finance/settings');
}

export async function updateFinanceSettings(body: {
    productListingPrice?: number;
    reactivationPrice?: number;
    listingPackages?: {
        OSON_START?: { price?: number; discountPrice?: number | null };
        TEZKOR_SAVDO?: { price?: number; discountPrice?: number | null };
        TURBO_SAVDO?: { price?: number; discountPrice?: number | null };
    };
    listingBundles?: {
        bundle5?: number;
        bundle10?: number;
        bundle20?: number;
    };
}): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/finance/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export async function updateProductPrice(productListingPrice: number): Promise<AuthResponse<any>> {
    return updateFinanceSettings({ productListingPrice });
}

export async function getAdminPayments(options?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
}): Promise<AuthResponse<any>> {
    return apiFetch('/api/admin/finance/payments', {
        params: {
            page: options?.page,
            limit: options?.limit,
            status: options?.status,
            type: options?.type,
        } as any,
    });
}
