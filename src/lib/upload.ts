import { supabase } from './supabase'

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * @param file The file to upload
 * @param bucket The bucket name (e.g., 'plots-images', 'operations-images')
 * @returns Promise resolving to the public URL of the uploaded file
 */
export async function uploadImage(file: File, bucket: string): Promise<string> {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const filePath = fileName

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true })

    if (uploadError) {
        throw uploadError
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

    return data.publicUrl
}
