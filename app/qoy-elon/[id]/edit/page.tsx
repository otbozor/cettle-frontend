'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Loader2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { FileUpload } from '@/components/ui/FileUpload';
import Link from 'next/link';
import {
    getMySheepListingById, updateSheepListingDraft, submitSheepListingForReview,
    attachMediaToSheepListing, getSheepBreeds, getRegionsWithDistricts, SheepBreed,
} from '@/lib/api';

interface Region { id: string; nameUz: string; districts?: { id: string; nameUz: string }[] }

function EditSheepListingContent() {
    const router = useRouter();
    const params = useParams();
    const listingId = params.id as string;
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [listingStatus, setListingStatus] = useState('');

    const [breeds, setBreeds] = useState<SheepBreed[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<{ id: string; nameUz: string }[]>([]);
    const [media, setMedia] = useState<Array<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }>>([]);

    const [form, setForm] = useState({
        animalType: 'QOY',
        title: '',
        breedId: '',
        regionId: '',
        districtId: '',
        purpose: '',
        gender: '',
        ageMonths: '',
        priceAmount: '',
        priceCurrency: 'UZS',
        hasVaccine: false,
        description: '',
    });

    useEffect(() => {
        if (!user) return;
        async function load() {
            try {
                const [breedsData, regionsData, listing] = await Promise.all([
                    getSheepBreeds(),
                    getRegionsWithDistricts(),
                    getMySheepListingById(listingId),
                ]);
                setBreeds(breedsData);
                setRegions(regionsData);
                setListingStatus(listing.status);

                const regionId = (listing as any).region?.id || (listing as any).regionId || '';
                const districtId = (listing as any).district?.id || (listing as any).districtId || '';
                const breedId = (listing as any).breed?.id || (listing as any).breedId || '';

                setForm({
                    animalType: (listing as any).animalType || 'QOY',
                    title: listing.title || '',
                    breedId,
                    regionId,
                    districtId,
                    purpose: (listing as any).purpose || '',
                    gender: (listing as any).gender || '',
                    ageMonths: (listing as any).ageMonths != null ? String((listing as any).ageMonths) : '',
                    priceAmount: listing.priceAmount ? String(listing.priceAmount) : '',
                    priceCurrency: listing.priceCurrency || 'UZS',
                    hasVaccine: (listing as any).hasVaccine || false,
                    description: (listing as any).description || '',
                });

                if (regionId) {
                    const reg = regionsData.find((r: Region) => r.id === regionId);
                    setDistricts(reg?.districts || []);
                }

                setMedia(listing.media?.map((m: any, i: number) => ({
                    url: m.url,
                    type: m.type || 'IMAGE',
                    sortOrder: i,
                })) || []);
            } catch (err: any) {
                setError(err.message || "E'lon topilmadi");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user, listingId]);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        if (name === 'regionId') {
            const region = regions.find(r => r.id === value);
            setDistricts(region?.districts || []);
            setForm(prev => ({ ...prev, regionId: value, districtId: '' }));
        } else if (name === 'animalType') {
            setForm(prev => ({ ...prev, animalType: value, breedId: '' }));
        } else {
            setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const buildPayload = () => ({
        animalType: form.animalType,
        title: form.title,
        breedId: form.breedId || undefined,
        regionId: form.regionId,
        districtId: form.districtId || undefined,
        purpose: form.purpose || undefined,
        gender: form.gender || undefined,
        ageMonths: form.ageMonths ? Number(form.ageMonths) : undefined,
        priceAmount: Number(form.priceAmount),
        priceCurrency: form.priceCurrency,
        hasVaccine: form.hasVaccine,
        description: form.description || undefined,
    });

    const handleSave = async () => {
        setError('');
        if (!form.title.trim()) return setError('Sarlavha kiriting');
        if (!form.regionId) return setError('Viloyatni tanlang');
        if (!form.priceAmount) return setError('Narxni kiriting');
        setSaving(true);
        try {
            await updateSheepListingDraft(listingId, buildPayload());
            if (media.length > 0) await attachMediaToSheepListing(listingId, media);
            router.push('/profil/elonlarim');
        } catch (err: any) {
            setError(err.message || 'Saqlanmadi');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        setError('');
        if (!form.title.trim()) return setError('Sarlavha kiriting');
        if (!form.regionId) return setError('Viloyatni tanlang');
        if (!form.priceAmount) return setError('Narxni kiriting');
        setSubmitting(true);
        try {
            await updateSheepListingDraft(listingId, buildPayload());
            if (media.length > 0) await attachMediaToSheepListing(listingId, media);
            await submitSheepListingForReview(listingId);
            router.push('/profil/elonlarim?success=true');
        } catch (err: any) {
            if (err?.status === 402 || err?.message?.includes('payment')) {
                router.push(`/qoy-elon/${listingId}/nashr-tolov`);
                return;
            }
            setError(err.message || 'Xatolik yuz berdi');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBreeds = breeds.filter(b => !form.animalType || b.animalType === form.animalType);
    const canEdit = ['DRAFT', 'REJECTED', 'EXPIRED', 'ARCHIVED', 'PENDING', 'APPROVED'].includes(listingStatus);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error && !form.title) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Xatolik</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                <Link href="/profil/elonlarim" className="btn btn-primary">
                    <ArrowLeft className="w-5 h-5" /> E&apos;lonlarimga qaytish
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                </button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Qo&apos;y/Echki e&apos;lonini tahrirlash</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Ma&apos;lumotlarni o&apos;zgartiring</p>

                {(listingStatus === 'PENDING' || listingStatus === 'APPROVED') && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            {listingStatus === 'PENDING'
                                ? "E'lon hozir tekshiruvda. O'zgartirish kiritib saqlasangiz, e'lon qayta qoralamaga o'tadi."
                                : "E'lon faol. O'zgartirish kiritib yuborilsa, qayta tekshiruvga o'tadi."}
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">

                {/* Animal Type */}
                <div>
                    <label className="label">Tur</label>
                    <div className="flex gap-3">
                        {[{ value: 'QOY', label: "🐑 Qo'y" }, { value: 'ECHKI', label: '🐐 Echki' }].map(opt => (
                            <label key={opt.value} className={`flex-1 text-center py-3 rounded-xl border-2 cursor-pointer transition-colors font-medium ${form.animalType === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'} ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <input type="radio" name="animalType" value={opt.value} checked={form.animalType === opt.value} onChange={handleChange} className="hidden" disabled={!canEdit} />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="label">Sarlavha *</label>
                    <input name="title" value={form.title} onChange={handleChange} className="input" disabled={!canEdit}
                        placeholder={form.animalType === 'ECHKI' ? 'Masalan: Zanen echki sotiladi' : "Masalan: Qoraqo'l qo'y sotiladi"} />
                </div>

                {/* Breed */}
                <div>
                    <label className="label">Zoti</label>
                    <CustomSelect name="breedId" value={form.breedId} onChange={handleChange} placeholder="Tanlang" disabled={!canEdit}
                        options={[{ value: '', label: 'Tanlang' }, ...filteredBreeds.map(b => ({ value: b.id, label: b.name }))]} />
                </div>

                {/* Region & District */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Viloyat *</label>
                        <CustomSelect name="regionId" value={form.regionId} onChange={handleChange} placeholder="Tanlang" disabled={!canEdit}
                            options={[{ value: '', label: 'Tanlang' }, ...regions.map(r => ({ value: r.id, label: r.nameUz }))]} />
                    </div>
                    <div>
                        <label className="label">Tuman</label>
                        <CustomSelect name="districtId" value={form.districtId} onChange={handleChange} placeholder="Tanlang"
                            disabled={!canEdit || !form.regionId}
                            options={[{ value: '', label: 'Tanlang' }, ...districts.map(d => ({ value: d.id, label: d.nameUz }))]} />
                    </div>
                </div>

                {/* Purpose & Gender */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Maqsad</label>
                        <CustomSelect name="purpose" value={form.purpose} onChange={handleChange} placeholder="Tanlang" disabled={!canEdit}
                            options={[
                                { value: '', label: 'Tanlang' },
                                { value: 'GOSHT', label: "Go'sht uchun" },
                                { value: 'JUN', label: 'Jun uchun' },
                                { value: 'SUT', label: 'Sut uchun' },
                                { value: 'NASLCHILIK', label: 'Naslchilik' },
                                { value: 'OMIXTA', label: 'Omixta' },
                            ]} />
                    </div>
                    <div>
                        <label className="label">Jinsi</label>
                        <CustomSelect name="gender" value={form.gender} onChange={handleChange} placeholder="Tanlang" disabled={!canEdit}
                            options={[
                                { value: '', label: 'Tanlang' },
                                { value: 'URGOCHI', label: "Urg'ochi" },
                                { value: 'ERKAK', label: 'Erkak' },
                            ]} />
                    </div>
                </div>

                {/* Age & Price */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Yoshi (oy)</label>
                        <input type="number" name="ageMonths" value={form.ageMonths} onChange={handleChange} className="input" placeholder="Masalan: 6" min="0" disabled={!canEdit} />
                    </div>
                    <div>
                        <label className="label">Narx *</label>
                        <div className="flex gap-2">
                            <input type="number" name="priceAmount" value={form.priceAmount} onChange={handleChange} className="input flex-1" placeholder="0" min="0" disabled={!canEdit} />
                            <CustomSelect name="priceCurrency" value={form.priceCurrency} onChange={handleChange} placeholder="UZS" disabled={!canEdit}
                                options={[{ value: 'UZS', label: "So'm" }, { value: 'USD', label: 'USD' }]} />
                        </div>
                    </div>
                </div>

                {/* Vaccine */}
                <div className="flex items-center gap-3">
                    <input type="checkbox" name="hasVaccine" id="hasVaccine" checked={form.hasVaccine} onChange={handleChange}
                        className="w-4 h-4 rounded accent-primary-600" disabled={!canEdit} />
                    <label htmlFor="hasVaccine" className="text-sm text-slate-700 dark:text-slate-300">Emlangan</label>
                </div>

                {/* Description */}
                <div>
                    <label className="label">Tavsif</label>
                    <textarea name="description" value={form.description} onChange={handleChange} className="input min-h-[100px]"
                        placeholder="Qo'shimcha ma'lumot..." disabled={!canEdit} />
                </div>

                {/* Media */}
                {canEdit && (
                    <div>
                        <label className="label">Rasmlar</label>
                        <FileUpload
                            maxFiles={8}
                            onFilesChange={setMedia}
                            initialFiles={media.filter(m => !m.url.startsWith('blob:'))}
                        />
                    </div>
                )}

                {/* Actions */}
                {canEdit && (
                    <div className="flex gap-3 pt-2">
                        <button onClick={handleSave} disabled={saving || submitting} className="btn btn-outline flex-1">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Saqlash
                        </button>
                        <button onClick={handleSubmit} disabled={saving || submitting} className="btn btn-primary flex-1">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Tekshiruvga yuborish
                        </button>
                    </div>
                )}

                {!canEdit && (
                    <Link href="/profil/elonlarim" className="btn btn-primary w-full justify-center">
                        Ortga qaytish
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function EditSheepListingPage() {
    return (
        <RequireAuth redirectTo="/profil/elonlarim">
            <EditSheepListingContent />
        </RequireAuth>
    );
}
