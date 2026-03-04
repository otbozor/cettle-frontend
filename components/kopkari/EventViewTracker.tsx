'use client';

import { useEffect } from 'react';

const CACHE_KEY = 'viewed_events';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 soat

function hasViewedRecently(slug: string): boolean {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return false;
        const cache: Record<string, number> = JSON.parse(raw);
        const ts = cache[slug];
        return !!ts && Date.now() - ts < CACHE_TTL_MS;
    } catch {
        return false;
    }
}

function markViewed(slug: string) {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        const cache: Record<string, number> = raw ? JSON.parse(raw) : {};
        cache[slug] = Date.now();
        const keys = Object.keys(cache);
        if (keys.length > 200) {
            keys.sort((a, b) => cache[a] - cache[b]);
            keys.slice(0, 50).forEach(k => delete cache[k]);
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { }
}

export function EventViewTracker({ slug }: { slug: string }) {
    useEffect(() => {
        if (hasViewedRecently(slug)) return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        fetch(`${apiBase}/api/events/${slug}/view`, {
            method: 'POST',
        }).then(() => {
            markViewed(slug);
        }).catch(() => { });
    }, [slug]);

    return null;
}
