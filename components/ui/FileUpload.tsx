'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface FileUploadProps {
    label?: string;
    maxFiles?: number;
    accept?: string;
    onFilesChange: (files: Array<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }>) => void;
    initialFiles?: Array<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }>;
}

export function FileUpload({
    label = "Rasmlar yuklash",
    maxFiles = 5,
    accept = "image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm",
    onFilesChange,
    initialFiles = []
}: FileUploadProps) {
    const { isAuthenticated } = useAuth();
    const [files, setFiles] = useState<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize with valid files only (no blob URLs)
    useEffect(() => {
        const validInitialFiles = initialFiles.filter(f => !f.url.startsWith('blob:'));
        if (validInitialFiles.length > 0) {
            setFiles(validInitialFiles);
        }
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        if (files.length + selectedFiles.length > maxFiles) {
            alert(`Maksimal ${maxFiles} ta fayl yuklash mumkin`);
            return;
        }

        setIsUploading(true);

        try {
            if (!isAuthenticated) {
                throw new Error('Tizimga kiring');
            }

            // Upload files to backend (Cloudinary)
            const uploadPromises = selectedFiles.map(async (file, idx) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'listings');

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media/upload`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Upload error response:', {
                        status: response.status,
                        statusText: response.statusText,
                        data: errorData,
                    });
                    throw new Error(
                        errorData.message || `Yuklash xatosi (${response.status})`,
                    );
                }

                const result = await response.json();
                const type: 'IMAGE' | 'VIDEO' = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

                return {
                    url: result.data.url, // Cloudinary URL
                    type,
                    sortOrder: files.length + idx,
                };
            });

            const newFiles = await Promise.all(uploadPromises);
            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        } catch (error: any) {
            console.error('Upload failed', error);
            alert(error.message || 'Rasmlarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
        } finally {
            setIsUploading(false);
            // Reset input
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index)
            .map((file, idx) => ({ ...file, sortOrder: idx })); // Reorder

        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    return (
        <div className="w-full">
            {label && <label className="label">{label}</label>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.map((file, index) => (
                    <div key={index} className="relative aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-600">
                        {file.type === 'VIDEO' ? (
                            <video
                                src={file.url}
                                className="w-full h-full object-cover"
                                aria-label={`Yuklangan video ${index + 1}`}
                                onError={(e) => {
                                    console.error('Video load error:', file.url);
                                }}
                            />
                        ) : (
                            <img
                                src={file.url}
                                alt={`Yuklangan rasm ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    console.error('Image load error:', file.url);
                                }}
                            />
                        )}

                        <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            type="button"
                            aria-label={`${index + 1}-faylni o'chirish`}
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-xs text-white">
                            {file.type === 'VIDEO' ? 'Video' : 'Rasm'} #{index + 1}
                        </div>
                    </div>
                ))}

                {files.length < maxFiles && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Fayl yuklash"
                    >
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                                <span className="text-sm text-slate-500 dark:text-slate-400">Yuklash</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={inputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept={accept}
            />

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Maksimal {maxFiles} ta fayl. JPG, PNG va MP4 formatlar.
            </p>
        </div>
    );
}
