import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
    label?: string
    onFileSelect: (file: File | null) => void
    previewUrl?: string | null
    onClear?: () => void
    error?: string | null
}

export default function ImageUpload({ label = 'صورة', onFileSelect, previewUrl, onClear, error }: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFile(file)
        }
    }

    const handleFile = (file: File) => {
        // Validate type
        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار صورة صالحة (JPG, PNG)')
            return
        }
        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
            return
        }
        onFileSelect(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleFile(file)
        }
    }

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

            {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 h-48 group">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                if (inputRef.current) inputRef.current.value = ''
                                onClear?.()
                            }}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${dragging
                        ? 'border-green-500 bg-green-50 scale-[1.02]'
                        : error
                            ? 'border-red-300 bg-red-50 hover:bg-gray-50'
                            : 'border-gray-300 hover:border-green-500 hover:bg-green-50/50'
                        }`}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${dragging ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'
                        }`}>
                        <Upload className="h-8 w-8" />
                    </div>

                    <div className="text-center space-y-1">
                        <p className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                            اضغط لاختيار صورة
                        </p>
                        <p className="text-sm text-gray-500">
                            أو اسحبها هنا
                        </p>
                    </div>

                    <div className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 shadow-sm group-hover:border-green-300 group-hover:text-green-700 transition-all">
                        تصفح الملفات
                    </div>

                    <p className="text-xs text-gray-400 mt-4">
                        PNG, JPG (الحد الأقصى 5 ميجابايت)
                    </p>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
            />

            {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
        </div>
    )
}
