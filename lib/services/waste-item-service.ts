import type { WasteItemPhoto, WasteItemWithLocation } from '@/types/database'

export interface WasteItemSearchFilters {
  zona?: number
  waste_type_id?: number
  subcategoria?: string
  quality?: string
  location_id?: number
  search?: string
  page?: number
  limit?: number
}

export const wasteItemService = {
  async searchWasteItems(
    filters: WasteItemSearchFilters
  ): Promise<{ data: WasteItemWithLocation[]; count: number }> {
    const params = new URLSearchParams()
    if (filters.zona) params.set('zona', filters.zona.toString())
    if (filters.waste_type_id) params.set('waste_type_id', filters.waste_type_id.toString())
    if (filters.subcategoria) params.set('subcategoria', filters.subcategoria)
    if (filters.quality) params.set('quality', filters.quality)
    if (filters.location_id) params.set('location_id', filters.location_id.toString())
    if (filters.search) params.set('search', filters.search)
    if (filters.page) params.set('page', filters.page.toString())
    if (filters.limit) params.set('limit', filters.limit.toString())

    const response = await fetch(`/api/waste-items?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch waste items')
    return response.json()
  },

  async getPhotos(itemId: number): Promise<WasteItemPhoto[]> {
    const response = await fetch(`/api/waste-items/${itemId}/photos`)
    if (!response.ok) throw new Error('Failed to fetch photos')
    return response.json()
  },

  async uploadPhotos(itemId: number, files: File[]): Promise<WasteItemPhoto[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const response = await fetch(`/api/waste-items/${itemId}/photos`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to upload photos')
    }
    return response.json()
  },

  async deletePhoto(itemId: number, photoId: number): Promise<void> {
    const response = await fetch(`/api/waste-items/${itemId}/photos?photoId=${photoId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to delete photo')
    }
  },
}
