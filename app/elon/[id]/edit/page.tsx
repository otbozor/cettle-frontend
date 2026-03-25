'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { ChevronRight, ChevronLeft, Save, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { FileUpload } from '@/components/ui/FileUpload';
import {
    getRegionsWithDistricts, getBreeds, updateListingDraft,
    attachMediaToListing, submitListingForReview,
    getMyListingById, PaymentRequiredError, Region, Breed, District
} from '@/lib/api';
import { RequireAuth } from '@/components/auth/RequireAuth';
import Link from 'next/link';

const steps = [
    { id: 1, title: 'Asosiy ma\'lumotlar' },
    { id: 2, title: 'Joylashuv' },
    { id: 3, title: 'Narx va holat' },
    { id: 4, title: 'Media' },
    { id: 5, title: 'Ko\'rib chiqish' },
];

function EditListingPageContent() {
    const router = useRouter();
    const params = useParams();
    const listingId = params.id as string;
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [breeds, setBreeds] = useState<Breed[]>([]);
    const [loading, setLoading] = useState(true);
    const [listingStatus, setListingStatus] = useState<string>('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        purpose: '',
        breedId: '',
        gender: '',
        ageYears: '',
        color: '',
        regionId: '',
        districtId: '',
        priceAmount: '',
        priceCurrency: 'UZS',
        hasPassport: false,
        hasVaccine: false,
        media: [] as Array<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }>,
    });

    useEffect(() => {
        return () => {
            formData.media.forEach(m => {
                if (m.url.startsWith('blob:')) URL.revokeObjectURL(m.url);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const [regionsData, breedsData, listing] = await Promise.all([
                    getRegionsWithDistricts(),
                    getBreeds(),
                    getMyListingById(listingId),
                ]);

                setRegions(regionsData);
                setBreeds(breedsData);
                setListingStatus(listing.status);

                // Pre-fill form with existing data
                const region = listing.region as any;
                const district = listing.district as any;
                const breed = listing.breed as any;

                setFormData({
                    title: listing.title || '',
                    description: listing.description || '',
                    purpose: listing.purpose || '',
                    breedId: breed?.id || '',
                    gender: listing.gender || '',
                    ageYears: listing.ageYears ? String(listing.ageYears) : '',
                    color: listing.color || '',
                    regionId: region?.id || '',
                    districtId: district?.id || '',
                    priceAmount: listing.priceAmount ? String(listing.priceAmount) : '',
                    priceCurrency: listing.priceCurrency || 'UZS',
                    hasPassport: listing.hasPassport || false,
                    hasVaccine: listing.hasVaccine || false,
                    media: listing.media?.map((m, i) => ({
                        url: m.url,
                        type: m.type || 'IMAGE',
                        sortOrder: i,
                    })) || [],
                });

                // Set districts based on region
                if (region?.id) {
                    const selectedRegion = regionsData.find(r => r.id === region.id);
                    setDistricts(selectedRegion?.districts || []);
                }
            } catch (err: any) {
                setError(err.message || 'E\'lon topilmadi');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, listingId]);

    useEffect(() => {
        if (formData.regionId && regions.length > 0) {
            const region = regions.find(r => r.id === formData.regionId);
            setDistricts(region?.districts || []);
        } else {
            setDistricts([]);
        }
    }, [formData.regionId, regions]);

    const handleChange = (e: { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const nextStep = () => { setCurrentStep(prev => Math.min(prev + 1, 5)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const prevStep = () => { setCurrentStep(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const canEdit = ['DRAFT', 'REJECTED', 'EXPIRED', 'ARCHIVED', 'PENDING', 'APPROVED'].includes(listingStatus);

    const saveChanges = async () => {
        setIsSubmitting(true);
        try {
            if (!formData.title || !formData.regionId || !formData.priceAmount) {
                setError('Iltimos barcha majburiy maydonlarni to\'ldiring');
                return false;
            }

            const data = {
                title: formData.title,
                description: formData.description || undefined,
                purpose: formData.purpose || undefined,
                breedId: formData.breedId || undefined,
                gender: formData.gender || undefined,
                ageYears: formData.ageYears ? Number(formData.ageYears) : undefined,
                color: formData.color || undefined,
                regionId: formData.regionId,
                districtId: formData.districtId || undefined,
                priceAmount: Number(formData.priceAmount),
                priceCurrency: formData.priceCurrency,
                hasPassport: formData.hasPassport,
                hasVaccine: formData.hasVaccine,
            };

            await updateListingDraft(listingId, data);
            setError('');
            return true;
        } catch (error: any) {
            console.error('Failed to save changes', error);
            setError(error.message || 'O\'zgarishlar saqlanmadi. Iltimos qayta urinib ko\'ring.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!canEdit) return;

        const saved = await saveChanges();
        if (!saved) return;

        setIsSubmitting(true);
        try {
            // Attach media
            if (formData.media.length > 0) {
                await attachMediaToListing(listingId, formData.media);
            }

            await submitListingForReview(listingId);
            router.push('/profil/elonlarim?success=true');
        } catch (error: any) {
            console.error('Failed to submit', error);
            if (error instanceof PaymentRequiredError) {
                router.push(`/elon/${error.listingId}/nashr-tolov`);
                return;
            }
            if (error.message?.includes('already submitted')) {
                router.push('/profil/elonlarim?success=true');
                return;
            }
            setError(error.message || 'Xatolik yuz berdi');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error && !formData.title) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-3xl">
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Xatolik</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                    <Link href="/profil/elonlarim" className="btn btn-primary">
                        <ArrowLeft className="w-5 h-5" />
                        E'lonlarimga qaytish
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-3xl pb-24 sm:pb-12">
            <div className="mb-8">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Orqaga
                </button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">E'lonni tahrirlash</h1>
                <p className="text-slate-500 dark:text-slate-400">Ma'lumotlarni o'zgartiring va qayta yuboring</p>

                {(listingStatus === 'PENDING' || listingStatus === 'APPROVED') && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            {listingStatus === 'PENDING'
                                ? "E'lon hozir tekshiruvda. O'zgartirish kiritib saqlasangiz, e'lon qayta qoralamaga o'tadi va qayta tekshiruvga yuborishingiz kerak bo'ladi."
                                : "E'lon hozir faol. O'zgartirish kiritib saqlasangiz, e'lon qayta tekshiruvga yuboriladi."}
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-medium text-red-900 dark:text-red-200 mb-1">Xatolik</h3>
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        ✕
                    </button>
                </div>
            )}

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-700 -z-10" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 transition-all duration-300 -z-10"
                    style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                />

                {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => setCurrentStep(step.id)}
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                ${currentStep >= step.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-400'}
                            `}
                        >
                            {step.id}
                        </button>
                        <span className={`text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700">

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <Input
                            label="Sarlavha"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Masalan: Qorabayir oti sotiladi"
                            required
                            disabled={!canEdit}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Maqsad</label>
                                <CustomSelect
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    placeholder="Tanlang"
                                    disabled={!canEdit}
                                    options={[
                                        { label: "Go'sht uchun", value: 'GOSHT' },
                                        { label: 'Sut uchun', value: 'SUT' },
                                        { label: 'Omixta', value: 'OMIXTA' },
                                        { label: 'Ishchi', value: 'ISHCHI' },
                                        { label: 'Omixta', value: 'OMIXTA' },
                                        { label: "Go'sht uchun", value: 'GOSHT' },
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="label">Zoti</label>
                                <CustomSelect
                                    name="breedId"
                                    value={formData.breedId}
                                    onChange={handleChange}
                                    placeholder="Tanlang"
                                    disabled={!canEdit}
                                    options={breeds.map(b => ({ label: b.name, value: b.id }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Jinsi</label>
                                <CustomSelect
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    placeholder="Tanlang"
                                    disabled={!canEdit}
                                    options={[
                                        { label: "Ho'kiz (erkak)", value: 'HOKIZ' },
                                        { label: "Sigir (urg'ochi)", value: 'SIGIR' },
                                    ]}
                                />
                            </div>

                            <Input
                                label="Yoshi (yil)"
                                type="number"
                                name="ageYears"
                                value={formData.ageYears}
                                onChange={handleChange}
                                placeholder="Masalan: 4"
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Rangi"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                placeholder="Masalan: Qora, Jiyron"
                                disabled={!canEdit}
                            />
                        </div>

                        <div>
                            <label className="label">Tavsif</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="input h-32 resize-none"
                                placeholder="Mol haqida batafsil ma'lumot..."
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Location */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="label">Viloyat</label>
                            <CustomSelect
                                name="regionId"
                                value={formData.regionId}
                                onChange={handleChange}
                                placeholder="Tanlang"
                                disabled={!canEdit}
                                options={regions.map(r => ({ label: r.nameUz, value: r.id }))}
                            />
                        </div>

                        <div>
                            <label className="label">Tuman</label>
                            <CustomSelect
                                name="districtId"
                                value={formData.districtId}
                                onChange={handleChange}
                                placeholder="Tanlang"
                                options={districts.map(d => ({ label: d.nameUz, value: d.id }))}
                                disabled={!canEdit || !formData.regionId}
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Price & Features */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Narx"
                                type="number"
                                name="priceAmount"
                                value={formData.priceAmount}
                                onChange={handleChange}
                                placeholder="0"
                                disabled={!canEdit}
                            />

                            <div>
                                <label className="label">Valyuta</label>
                                <CustomSelect
                                    name="priceCurrency"
                                    value={formData.priceCurrency}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    options={[
                                        { label: "So'm (UZS)", value: 'UZS' },
                                        { label: 'Dollar (USD)', value: 'USD' },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="label">Qo'shimcha ma'lumotlar</label>

                            <label className="flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary-300 transition-all">
                                <input
                                    type="checkbox"
                                    name="hasPassport"
                                    checked={formData.hasPassport}
                                    onChange={handleCheckbox}
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                    disabled={!canEdit}
                                />
                                <span className="text-slate-900 dark:text-slate-100 font-medium text-base">Hujjati (pasporti) bor</span>
                            </label>

                            <label className="flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary-300 transition-all">
                                <input
                                    type="checkbox"
                                    name="hasVaccine"
                                    checked={formData.hasVaccine}
                                    onChange={handleCheckbox}
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                    disabled={!canEdit}
                                />
                                <span className="text-slate-900 dark:text-slate-100 font-medium text-base">Emlangan (vaktsina qilingan)</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 4: Media */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-fade-in">
                        {canEdit ? (
                            <FileUpload
                                key="listing-media-edit"
                                onFilesChange={(files) => setFormData(prev => ({ ...prev, media: files }))}
                                maxFiles={8}
                                initialFiles={formData.media.filter(m => !m.url.startsWith('blob:'))}
                            />
                        ) : (
                            <div>
                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Yuklangan rasmlar ({formData.media.length})</h3>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {formData.media.map((media, idx) => (
                                        <div key={idx} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                            {media.type === 'VIDEO' ? (
                                                <video src={media.url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={media.url} alt={`Rasm ${idx + 1}`} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Preview */}
                {currentStep === 5 && (
                    <div className="space-y-6 animate-fade-in">
                        {formData.media.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Rasmlar ({formData.media.length})</h3>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {formData.media.slice(0, 8).map((media, idx) => (
                                        <div key={idx} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                            {media.type === 'VIDEO' ? (
                                                <video src={media.url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={media.url} alt={`Rasm ${idx + 1}`} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl space-y-4">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-4">{formData.title}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-slate-500 dark:text-slate-400 text-sm mb-1">Narx</span>
                                    <span className="font-semibold text-primary-600 dark:text-primary-400 text-lg">{formData.priceAmount} {formData.priceCurrency}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 dark:text-slate-400 text-sm mb-1">Joylashuv</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {regions.find(r => r.id === formData.regionId)?.nameUz}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-slate-500 dark:text-slate-400 text-sm mb-1">Zoti</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {breeds.find(b => b.id === formData.breedId)?.name || '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 dark:text-slate-400 text-sm mb-1">Rasmlar</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {formData.media.length} ta fayl
                                    </span>
                                </div>
                            </div>
                        </div>

                        {canEdit && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                O'zgarishlarni saqlang yoki tekshiruvga yuboring.
                                Moderatorlar e'lonni tekshirib chiqqandan so'ng u saytda ko'rinadi.
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-between sm:static sm:bg-transparent sm:dark:bg-transparent sm:border-slate-200 sm:mt-8 sm:pt-6 sm:px-0 sm:py-0 sm:z-auto">
                    {currentStep === 1 ? (
                        <Link href="/profil/elonlarim" className="btn btn-outline">
                            Bekor qilish
                        </Link>
                    ) : (
                        <button onClick={prevStep} className="btn btn-outline">
                            <ChevronLeft className="w-5 h-5" />
                            Ortga
                        </button>
                    )}

                    {currentStep < 5 ? (
                        <button
                            onClick={() => nextStep()}
                            className="btn btn-primary"
                        >
                            Keyingi
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : canEdit ? (
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    const saved = await saveChanges();
                                    if (saved) {
                                        router.push('/profil/elonlarim');
                                    }
                                }}
                                disabled={isSubmitting}
                                className="btn btn-outline"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Saqlash
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="btn btn-primary"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Tekshiruvga yuborish
                            </button>
                        </div>
                    ) : (
                        <Link href="/profil/elonlarim" className="btn btn-primary">
                            Ortga qaytish
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function EditListingPage() {
    return (
        <RequireAuth redirectTo="/profil/elonlarim">
            <EditListingPageContent />
        </RequireAuth>
    );
}
