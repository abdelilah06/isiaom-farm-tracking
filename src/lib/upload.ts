import { supabase } from './supabase'

/**
 * Compresses an image file before upload
 * @param file The original image file
 * @param maxWidth Maximum width in pixels (default: 1920)
 * @param quality Image quality 0-1 (default: 0.8)
 * @returns Promise resolving to compressed File
 */
async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'))
                            return
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        })
                        resolve(compressedFile)
                    },
                    'image/jpeg',
                    quality
                )
            }
            img.onerror = () => reject(new Error('Failed to load image'))
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
    })
}

/**
 * Uploads a file to a specified Supabase Storage bucket with automatic compression.
 * @param file The file to upload
 * @param bucket The bucket name (e.g., 'plots-images', 'operations-images')
 * @param compress Whether to compress the image (default: true)
 * @returns Promise resolving to the public URL of the uploaded file
 */
export async function uploadImage(file: File, bucket: string, compress: boolean = true): Promise<string> {
    try {
        let fileToUpload = file

        // Compress image if it's an image file and compression is enabled
        if (compress && file.type.startsWith('image/')) {
            try {
                fileToUpload = await compressImage(file)
                console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(fileToUpload.size / 1024).toFixed(2)}KB`)
            } catch (compressionError) {
                console.warn('Image compression failed, uploading original:', compressionError)
                // Continue with original file if compression fails
            }
        }

        const fileName = `${Date.now()}_${fileToUpload.name.replace(/\s+/g, '_')}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileToUpload, { upsert: true })

        if (uploadError) {
            throw uploadError
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return data.publicUrl
    } catch (error) {
        console.error('Upload error:', error)
        throw new Error(`فشل رفع الصورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
    }
}
