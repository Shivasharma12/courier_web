'use client';

import { useState, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    onImagesChange: (urls: string[]) => void;
    maxImages?: number;
}

export default function ImageUpload({ onImagesChange, maxImages = 3 }: ImageUploadProps) {
    const [images, setImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages = [...images];
        for (let i = 0; i < files.length; i++) {
            if (newImages.length >= maxImages) break;
            // In a real app, we would upload to S3/Cloudinary and get a URL
            // For this demo, we'll use local object URLs
            const url = URL.createObjectURL(files[i]);
            newImages.push(url);
        }

        setImages(newImages);
        onImagesChange(newImages);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                        <img src={url} alt={`Parcel ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {images.length < maxImages && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-all"
                    >
                        <Camera className="h-6 w-6" />
                        <span className="text-xs font-medium">Add Photo</span>
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            <p className="text-xs text-slate-500">
                Upload up to {maxImages} photos of your parcel.
            </p>
        </div>
    );
}
