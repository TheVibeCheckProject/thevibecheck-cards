
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

// Bucket name constant
const BUCKET_NAME = 'card-assets'

/**
 * Uploads an asset for a specific card.
 * Path format: cards/{userId}/{cardId}/assets/{uuid}.{ext}
 */
export async function uploadCardAsset(
    userId: string,
    cardId: string,
    file: File
): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`
    const path = `cards/${userId}/${cardId}/assets/${fileName}`

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file)

    if (error) {
        throw error
    }

    return path
}

/**
 * Getting a signed URL for display.
 * Since we want stable paths in the DB, we resolve them to signed URLs at runtime.
 */
export async function getAssetUrl(path: string): Promise<string | null> {
    const supabase = createClient()
    // Try creating a signed URL valid for 1 hour
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, 3600)

    if (error) {
        console.error('Error creating signed URL:', error)
        return null
    }

    return data.signedUrl
}
