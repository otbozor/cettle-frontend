'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Loader2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { FileUpload } from '@/components/ui/FileUpload';
import { createSheepListingDraft, updateSheepListingDraft, submitSheepListingForReview, attachMediaToSheepListing, getSheepBreeds, getRegionsWithDistricts, SheepBreed } from '@/lib/api';

interface Region { id: string; nameUz: string; districts?: { id: string; nameUz: string }[] }

function CreateSheepForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        async function load() {
            const [breedsData, regionsData] = await Promise.all([
                getSheepBreeds(),
                getRegionsWithDistricts(),
            ]);
            setBreeds(breedsData);
            setRegions(regionsData);
        }
        load();
    }, []);

    const filteredBreeds = breeds.filter(b => !form.animalType || b.animalType === form.animalType);

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

    const handleSubmit = async () => {
        setError('');
        if (!form.title.trim()) return setError('Sarlavha kiriting');
        if (!form.regionId) return setError('Viloyatni tanlang');
        if (!form.priceAmount) return setError('Narxni kiriting');
        if (media.length === 0) return setError('Kamida bitta rasm yuklang');

        setLoading(true);
        try {
            const token = document.cookie.includes('accessToken') ? undefined : undefined;

            // 1. Draft yaratish
            const draft = await createSheepListingDraft({
                ...form,
                ageMonths: form.ageMonths ? Number(form.ageMonths) : undefined,
                priceAmount: Number(form.priceAmount),
                breedId: form.breedId || undefined,
                districtId: form.districtId || undefined,
                purpose: form.purpose || undefined,
                gender: form.gender || undefined,
            });

            // 2. Media biriktirish
            await attachMediaToSheepListing(draft.id, media);

            // 3. Ko'rib chiqishga yuborish
            await submitSheepListingForReview(draft.id);

            router.push('/profil/elonlarim');
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Qo'y/Echki e'loni</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Ma'lumotlarni to'ldiring</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">

                {/* Animal Type */}
                <div>
                    <label className="label">Tur *</label>
                    <div className="flex gap-3">
                        {[{ value: 'QOY', label: "🐑 Qo'y" }, { value: 'ECHKI', label: '🐐 Echki' }].map(opt => (
                            <label key={opt.value} className={`flex-1 text-center py-3 rounded-xl border-2 cursor-pointer transition-colors font-medium ${form.animalType === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'}`}>
                                <input type="radio" name="animalType" value={opt.value} checked={form.animalType === opt.value} onChange={handleChange} className="hidden" />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="label">Sarlavha *</label>
                    <input name="title" value={form.title} onChange={handleChange} className="input"
                        placeholder={form.animalType === 'ECHKI' ? 'Masalan: Zanen echki sotiladi' : "Masalan: Qoraqo'l qo'y sotiladi"} />
                </div>

                {/* Breed */}
                <div>
                    <label className="label">Zoti</label>
                    <CustomSelect name="breedId" value={form.breedId} onChange={handleChange} placeholder="Tanlang"
                        options={[{ value: '', label: 'Tanlang' }, ...filteredBreeds.map(b => ({ value: b.id, label: b.name }))]} />
                </div>

                {/* Region & District */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Viloyat *</label>
                        <CustomSelect name="regionId" value={form.regionId} onChange={handleChange} placeholder="Tanlang"
                            options={[{ value: '', label: 'Tanlang' }, ...regions.map(r => ({ value: r.id, label: r.nameUz }))]} />
                    </div>
                    <div>
                        <label className="label">Tuman</label>
                        <CustomSelect name="districtId" value={form.districtId} onChange={handleChange} placeholder="Tanlang"
                            disabled={!form.regionId}
                            options={[{ value: '', label: 'Tanlang' }, ...districts.map(d => ({ value: d.id, label: d.nameUz }))]} />
                    </div>
                </div>

                {/* Purpose & Gender */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Maqsad</label>
                        <CustomSelect name="purpose" value={form.purpose} onChange={handleChange} placeholder="Tanlang"
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
                        <CustomSelect name="gender" value={form.gender} onChange={handleChange} placeholder="Tanlang"
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
                        <input type="number" name="ageMonths" value={form.ageMonths} onChange={handleChange} className="input" placeholder="Masalan: 6" min="0" />
                    </div>
                    <div>
                        <label className="label">Narx *</label>
                        <div className="flex gap-2">
                            <input type="number" name="priceAmount" value={form.priceAmount} onChange={handleChange} className="input flex-1" placeholder="0" min="0" />
                            <CustomSelect name="priceCurrency" value={form.priceCurrency} onChange={handleChange} placeholder="UZS"
                                options={[{ value: 'UZS', label: "So'm" }, { value: 'USD', label: 'USD' }]} />
                        </div>
                    </div>
                </div>

                {/* Vaccine */}
                <div className="flex items-center gap-3">
                    <input type="checkbox" name="hasVaccine" id="hasVaccine" checked={form.hasVaccine} onChange={handleChange} className="w-4 h-4 rounded accent-primary-600" />
                    <label htmlFor="hasVaccine" className="text-sm text-slate-700 dark:text-slate-300">Emlangan</label>
                </div>

                {/* Description */}
                <div>
                    <label className="label">Tavsif</label>
                    <textarea name="description" value={form.description} onChange={handleChange} className="input min-h-[100px]"
                        placeholder="Qo'shimcha ma'lumot..." />
                </div>

                {/* Media */}
                <div>
                    <label className="label">Rasmlar *</label>
                    <FileUpload maxFiles={8} onFilesChange={setMedia} />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button onClick={handleSubmit} disabled={loading} className="btn btn-primary w-full">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Yuklanmoqda...</> : "E'lon joylash"}
                </button>
            </div>
        </div>
    );
}

export default function CreateSheepListingPage() {
    return (
        <RequireAuth>
            <CreateSheepForm />
        </RequireAuth>
    );
}
