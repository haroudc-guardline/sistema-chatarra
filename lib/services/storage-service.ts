import { supabase } from '@/lib/supabase/client'

export const storageService = {
  // Upload file to Supabase Storage
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return data
  },

  // Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  // Download file
  async downloadFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) throw error
    return data
  },

  // Delete file
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  },

  // List files in bucket
  async listFiles(bucket: string, prefix?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix)

    if (error) throw error
    return data
  }
}
