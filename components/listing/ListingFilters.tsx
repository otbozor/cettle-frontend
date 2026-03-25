'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRegionsWithDistricts, getBreeds, Region, District, Breed } from '@/lib/api';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface Props {
    onApply?: () => void;
    hideTitle?: boolean;
}

export function ListingFilters({ onApply, hideTitle }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [regions, setRegions] = useState<Region[]>([]);
    const [breeds, setBreeds] = useState<Breed[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize state from URL params
    const [filters, setFilters] = useState({
        regionId: searchParams.get('regionId') || '',
        districtId: searchParams.get('districtId') || '',
        breedId: searchParams.get('breedId') || '',
        purpose: searchParams.get('purpose') || '',
        gender: searchParams.get('gender') || '',
        priceMin: searchParams.get('priceMin') || '',
        priceMax: searchParams.get('priceMax') || '',
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [regionsData, breedsData] = await Promise.all([
                    getRegionsWithDistricts(),
                    getBreeds(),
                ]);
                setRegions(regionsData);
                setBreeds(breedsData);
            } catch (error) {
                console.error('Failed to load filter data', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Derive districts from the selected region
    const districts = useMemo<District[]>(() => {
        if (!filters.regionId) return [];
        const region = regions.find(r => r.id === filters.regionId);
        return region?.districts || [];
    }, [filters.regionId, regions]);

    const handleChange = (e: { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        if (name === 'regionId') {
            // Clear district when region changes
            setFilters(prev => ({ ...prev, regionId: value, districtId: '' }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    const applyFilters = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        router.push(`/bozor?${params.toString()}`);
        onApply?.();
    };

    const clearFilters = () => {
        setFilters({
            regionId: '',
            districtId: '',
            breedId: '',
            purpose: '',
            gender: '',
            priceMin: '',
            priceMax: '',
        });
        router.push('/bozor');
        onApply?.();
    };

    if (isLoading) return <div className="p-4"><div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-700 rounded-xl"></div></div>;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 lg:p-6 space-y-6">
            {!hideTitle && (
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Filtrlar</h3>
                    <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Tozalash
                    </button>
                </div>
            )}

            {/* Region */}
            <div>
                <label className="label">Viloyat</label>
                <CustomSelect
                    name="regionId"
                    value={filters.regionId}
                    onChange={handleChange}
                    placeholder="Barchasi"
                    options={[
                        { value: '', label: 'Barchasi' },
                        ...regions.map(r => ({ value: r.id, label: r.nameUz }))
                    ]}
                />
            </div>

            {/* District */}
            <div>
                <label className="label">Tuman</label>
                <CustomSelect
                    name="districtId"
                    value={filters.districtId}
                    onChange={handleChange}
                    placeholder="Barchasi"
                    disabled={!filters.regionId || districts.length === 0}
                    options={[
                        { value: '', label: 'Barchasi' },
                        ...districts.map(d => ({ value: d.id, label: d.nameUz }))
                    ]}
                />
            </div>

            {/* Purpose */}
            <div>
                <label className="label">Maqsad</label>
                <CustomSelect
                    name="purpose"
                    value={filters.purpose}
                    onChange={handleChange}
                    placeholder="Barchasi"
                    options={[
                        { value: '', label: 'Barchasi' },
                        { value: 'GOSHT', label: "Go'sht uchun" },
                        { value: 'SUT', label: 'Sut uchun' },
                        { value: 'NASLCHILIK', label: 'Naslchilik' },
                        { value: 'ISHCHI', label: 'Ishchi' },
                        { value: 'OMIXTA', label: 'Omixta' },
                    ]}
                />
            </div>

            {/* Breed */}
            <div>
                <label className="label">Zoti</label>
                <CustomSelect
                    name="breedId"
                    value={filters.breedId}
                    onChange={handleChange}
                    placeholder="Barchasi"
                    options={[
                        { value: '', label: 'Barchasi' },
                        ...breeds.map(b => ({ value: b.id, label: b.name }))
                    ]}
                />
            </div>

            {/* Price */}
            <div>
                <label className="label">Narx (so'm)</label>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        name="priceMin"
                        placeholder="Min"
                        value={filters.priceMin}
                        onChange={handleChange}
                        className="input text-sm"
                        min="0"
                        step="1000"
                    />
                    <input
                        type="number"
                        name="priceMax"
                        placeholder="Max"
                        value={filters.priceMax}
                        onChange={handleChange}
                        className="input text-sm"
                        min="0"
                        step="1000"
                    />
                </div>
            </div>

            {/* Gender */}
            <div>
                <label className="label">Jinsi</label>
                <div className="flex gap-2">
                    {['HOKIZ', 'SIGIR'].map((g) => (
                        <label key={g} className={`
                flex-1 text-center py-2 px-1 rounded-lg border text-sm cursor-pointer transition-colors
                ${filters.gender === g
                                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-400 font-medium'
                                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
             `}>
                            <input
                                type="radio"
                                name="gender"
                                value={g}
                                checked={filters.gender === g}
                                onChange={handleChange}
                                className="hidden"
                            />
                            {g === 'HOKIZ' ? "Ho'kiz" : 'Sigir'}
                        </label>
                    ))}
                </div>
            </div>

            {hideTitle && (
                <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium block">
                    Filtrlarni tozalash
                </button>
            )}

            <button onClick={applyFilters} className="btn btn-primary w-full">
                Filtrlash
            </button>
        </div>
    );
}
