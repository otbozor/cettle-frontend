'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Loader2, Package } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { FileUpload } from '@/components/ui/FileUpload';

interface Category {
    id: string;
    name: string;
}

interface District {
    id: string;
    nameUz: string;
}

interface Region {
    id: string;
    nameUz: string;
    districts: District[];
}

function CreateProductForm() {
    const router = useRouter();
    useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [media, setMedia] = useState<Array<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }>>([]);

    const [form, setForm] = useState({
        title: '',
        categoryId: '',
        regionId: '',
        districtId: '',
        description: '',
        priceAmount: '',
        priceCurrency: 'UZS',
        hasDelivery: false,
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetch(`${API_URL}/api/products/categories`)
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {});

        fetch(`${API_URL}/api/regions/with-districts`)
            .then(r => r.json())
            .then(data => setRegions(Array.isArray(data?.data) ? data.data : []))
            .catch(() => {});
    }, []);

    const selectedRegion = regions.find(r => r.id === form.regionId);
    const districts = selectedRegion?.districts || [];

    const handleChange = (e: { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        if (name === 'regionId') {
            setForm(prev => ({ ...prev, regionId: value, districtId: '' }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.title.trim()) return setError('Sarlavha kiritish majburiy');
        if (!form.regionId) return setError('Viloyatni tanlash majburiy');
        if (!form.districtId) return setError('Tumanni tanlash majburiy');
        if (!form.priceAmount || Number(form.priceAmount) <= 0) return setError('To\'g\'ri narx kiriting');

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: form.title,
                    categoryId: form.categoryId || undefined,
                    regionId: form.regionId || undefined,
                    districtId: form.districtId || undefined,
                    description: form.description || undefined,
                    priceAmount: Number(form.priceAmount),
                    priceCurrency: form.priceCurrency,
                    hasDelivery: form.hasDelivery,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Xatolik yuz berdi');
            }

            const productId = data.id;

            if (media.length > 0) {
                await fetch(`${API_URL}/api/media/attach`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ productId, media }),
                });
            }

            router.push(`/mahsulot/${productId}/tolov`);
        } catch (err: any) {
            setError(err.message || 'Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mahsulot joylash</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                    Ot uchun mahsulot yoki aksessuarni joylang. Admin tekshirib nashr etadi.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="label">Mahsulot nomi *</label>
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="input"
                        placeholder="Masalan: Ozuqa, Dori, Sutchilik jihozi..."
                        required
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="label">Kategoriya</label>
                    <CustomSelect
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        placeholder="Kategoriya tanlang"
                        options={[
                            { value: '', label: 'Kategoriya tanlang' },
                            ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                        ]}
                    />
                </div>

                {/* Region & District */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Viloyat <span className="text-red-500">*</span></label>
                        <CustomSelect
                            name="regionId"
                            value={form.regionId}
                            onChange={handleChange}
                            placeholder="Viloyat tanlang"
                            options={[
                                { value: '', label: 'Viloyat tanlang' },
                                ...regions.map(r => ({ value: r.id, label: r.nameUz }))
                            ]}
                        />
                    </div>
                    <div>
                        <label className="label">Tuman <span className="text-red-500">*</span></label>
                        <CustomSelect
                            name="districtId"
                            value={form.districtId}
                            onChange={handleChange}
                            placeholder="Tuman tanlang"
                            options={[
                                { value: '', label: 'Tuman tanlang' },
                                ...districts.map(d => ({ value: d.id, label: d.nameUz }))
                            ]}
                        />
                    </div>
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Narx *</label>
                        <input
                            name="priceAmount"
                            type="number"
                            value={form.priceAmount}
                            onChange={handleChange}
                            className="input"
                            placeholder="0"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Valyuta</label>
                        <CustomSelect
                            name="priceCurrency"
                            value={form.priceCurrency}
                            onChange={handleChange}
                            options={[
                                { value: 'UZS', label: "So'm (UZS)" },
                                { value: 'USD', label: 'Dollar (USD)' },
                            ]}
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="label">Tavsif</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="input min-h-[100px] resize-none"
                        placeholder="Mahsulot haqida qo'shimcha ma'lumot..."
                        rows={4}
                    />
                </div>

                {/* Delivery */}
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="hasDelivery"
                        checked={form.hasDelivery}
                        onChange={handleCheckbox}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Yetkazib berish mavjud
                    </span>
                </label>

                {/* Rasmlar */}
                <div>
                    <FileUpload
                        label="Rasmlar (ixtiyoriy)"
                        maxFiles={6}
                        accept="image/*"
                        onFilesChange={setMedia}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full justify-center"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</>
                    ) : (
                        <><Package className="w-4 h-4" /> Mahsulotni joylash</>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function CreateProductPage() {
    return (
        <RequireAuth>
            <CreateProductForm />
        </RequireAuth>
    );
}
