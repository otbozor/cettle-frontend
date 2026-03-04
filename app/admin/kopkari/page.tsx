'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { getAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent } from '@/lib/admin-api';
import { getRegionsWithDistricts, Region } from '@/lib/api';
import { Plus, Edit, Trash2, Loader2, X, Save, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { HorseshoeIcon } from '@/components/icons/HorseIcons';
import { CustomSelect } from '@/components/ui/CustomSelect';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Event {
    id: string;
    title: string;
    slug: string;
    startsAt: string;
    organizerName: string;
    prizePool?: string;
    status: string;
    region: { nameUz: string };
    district?: { nameUz: string };
}

const EMPTY_FORM = {
    title: '',
    slug: '',
    description: '',
    startsAt: '',
    endsAt: '',
    regionId: '',
    districtId: '',
    addressText: '',
    mapUrl: '',
    organizerName: '',
    contactTelegram: '',
    prizePool: '',
    rules: '',
};

function slugify(text: string) {
    const base = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `${base}-${Date.now().toString(36)}`;
}

function convertToEmbedUrl(url: string): string {
    if (!url) return url;
    if (url.includes('/maps/embed') || url.includes('output=embed')) return url;
    // Extract coordinates from @lat,lng pattern
    const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
        return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
    }
    return url;
}

const ITEMS_PER_PAGE = 20;

export default function AdminKopkariPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return events.slice(start, start + ITEMS_PER_PAGE);
    }, [events, currentPage]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [evRes, regRes] = await Promise.all([
                getAdminEvents(),
                getRegionsWithDistricts(),
            ]);
            setEvents(Array.isArray(evRes.data) ? evRes.data : []);
            setRegions(regRes);
        } catch (e) {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        setForm(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'title' && !editId) updated.slug = slugify(value);
            if (name === 'regionId') updated.districtId = '';
            if (name === 'mapUrl') updated.mapUrl = convertToEmbedUrl(value);
            return updated;
        });
    };

    const openCreate = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setError('');
        setShowForm(true);
    };

    const openEdit = (ev: Event) => {
        setEditId(ev.id);
        setForm({
            title: ev.title,
            slug: ev.slug,
            description: (ev as any).description || '',
            startsAt: ev.startsAt ? ev.startsAt.slice(0, 16) : '',
            endsAt: (ev as any).endsAt ? (ev as any).endsAt.slice(0, 16) : '',
            regionId: (ev as any).regionId || '',
            districtId: (ev as any).districtId || '',
            addressText: (ev as any).addressText || '',
            mapUrl: (ev as any).mapUrl || '',
            organizerName: ev.organizerName,
            contactTelegram: (ev as any).contactTelegram || '',
            prizePool: ev.prizePool ? String(ev.prizePool) : '',
            rules: (ev as any).rules || '',
        });
        setError('');
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.startsAt || !form.regionId || !form.organizerName) {
            setError("Sarlavha, sana, viloyat va tashkilotchi majburiy");
            return;
        }
        setSaving(true);
        setError('');
        try {
            const payload: any = {
                ...form,
                prizePool: form.prizePool || undefined,
                endsAt: form.endsAt || undefined,
                districtId: form.districtId || undefined,
                addressText: form.addressText || undefined,
                contactTelegram: form.contactTelegram || undefined,
                rules: form.rules || undefined,
                description: form.description || undefined,
            };
            if (editId) {
                await updateAdminEvent(editId, payload);
            } else {
                payload.status = 'PUBLISHED';
                await createAdminEvent(payload);
            }
            setShowForm(false);
            await loadData();
        } catch (e: any) {
            setError(e.message || 'Xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tadbirni o'chirishni xohlaysizmi?")) return;
        try {
            await deleteAdminEvent(id);
            await loadData();
        } catch (e: any) {
            alert('Xatolik: ' + e.message);
        }
    };

    const selectedRegion = regions.find(r => r.id === form.regionId);
    const districts = selectedRegion?.districts || [];

    return (
        <AdminLayout>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ko'pkari Tadbirlari</h1>
                    <p className="text-slate-500 text-sm">Barcha ko'pkari va ot musobaqalarini boshqarish</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Yangi tadbir
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {editId ? 'Tadbirni tahrirlash' : 'Yangi tadbir qo\'shish'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Sarlavha *</label>
                                    <input name="title" value={form.title} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Ko'pkari musobaqasi nomi" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                    <input name="slug" value={form.slug} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="musobaqa-nomi" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tashkilotchi *</label>
                                    <input name="organizerName" value={form.organizerName} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Tashkilotchi ismi" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Boshlanish sanasi *</label>
                                    <input type="datetime-local" name="startsAt" value={form.startsAt} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tugash sanasi</label>
                                    <input type="datetime-local" name="endsAt" value={form.endsAt} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Viloyat *</label>
                                    <CustomSelect
                                        name="regionId"
                                        value={form.regionId}
                                        onChange={handleChange}
                                        options={[
                                            { value: '', label: 'Viloyatni tanlang' },
                                            ...regions.map(r => ({ value: r.id, label: r.nameUz }))
                                        ]}
                                        placeholder="Viloyatni tanlang"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tuman</label>
                                    <CustomSelect
                                        name="districtId"
                                        value={form.districtId}
                                        onChange={handleChange}
                                        options={[
                                            { value: '', label: 'Tumanni tanlang' },
                                            ...districts.map(d => ({ value: d.id, label: d.nameUz }))
                                        ]}
                                        placeholder="Tumanni tanlang"
                                        disabled={!form.regionId}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Manzil matni</label>
                                    <input name="addressText" value={form.addressText} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="To'liq manzil" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Xarita URL (Google Maps)</label>
                                    <input name="mapUrl" value={form.mapUrl} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="https://www.google.com/maps/place/... yoki embed URL" />
                                    <p className="text-xs text-slate-400 mt-1">
                                        Har qanday Google Maps URL'ni joylashtiring — avtomatik o'zgartiriladi
                                    </p>
                                    {form.mapUrl && (form.mapUrl.includes('output=embed') || form.mapUrl.includes('/maps/embed')) && (
                                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200" style={{ height: 180 }}>
                                            <iframe
                                                src={form.mapUrl}
                                                width="100%"
                                                height="180"
                                                style={{ border: 0 }}
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Telegram kontakt</label>
                                    <input name="contactTelegram" value={form.contactTelegram} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="username (@ siz)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Sovrin jamg'armasi</label>
                                    <input type="text" name="prizePool" value={form.prizePool} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Masalan: 5 000 000 so'm yoki Yo'q" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tavsif</label>
                                    <RichTextEditor
                                        value={form.description}
                                        onChange={(val) => setForm(prev => ({ ...prev, description: val }))}
                                        placeholder="Tadbir haqida batafsil..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Qoidalar</label>
                                    <textarea name="rules" value={form.rules} onChange={handleChange} rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                        placeholder="Musobaqa qoidalari..." />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-slate-200">
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editId ? 'Saqlash' : 'Yaratish'}
                            </button>
                            <button onClick={() => setShowForm(false)}
                                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="mb-3 flex justify-center"><HorseshoeIcon className="w-12 h-12 text-slate-300" /></div>
                        <p className="text-slate-500">Hozircha tadbirlar yo'q</p>
                        <button onClick={openCreate} className="mt-4 text-amber-600 hover:underline text-sm">
                            Birinchi tadbirni qo'shing
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tadbir</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Sana</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Joylashuv</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {paginatedEvents.map((ev) => (
                                        <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{ev.title}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{ev.organizerName}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(ev.startsAt).toLocaleDateString('uz-UZ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {ev.region?.nameUz}{ev.district && `, ${ev.district.nameUz}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(ev)}
                                                        title="Tahrirlash"
                                                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(ev.id)}
                                                        title="O'chirish"
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Sahifa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${p === currentPage
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
