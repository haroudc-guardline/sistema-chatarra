import { supabase } from '@/lib/supabase/client'
import type { Location, LocationWithDetails, WasteType, LocationDocument } from '@/types/database'

export const locationService = {
  // List all locations with optional filters
  async getLocations(filters?: {
    ciudad?: string
    municipio?: string
    corregimiento?: string
    search?: string
    wasteTypeIds?: number[]
  }) {
    let query = supabase
      .from('locations')
      .select(`
        *,
        location_waste_types(waste_type_id, waste_types(*))
      `)
      .order('created_at', { ascending: false })

    if (filters?.ciudad) {
      query = query.eq('ciudad', filters.ciudad)
    }
    if (filters?.municipio) {
      query = query.eq('municipio', filters.municipio)
    }
    if (filters?.corregimiento) {
      query = query.eq('corregimiento', filters.corregimiento)
    }
    if (filters?.search) {
      query = query.ilike('nombre_institucion', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data as LocationWithDetails[]
  },

  // Get single location by ID
  async getLocationById(id: number) {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        location_waste_types(waste_type_id, waste_types(*)),
        location_documents(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as LocationWithDetails
  },

  // Create new location
  async createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single()

    if (error) throw error
    return data as Location
  },

  // Update location
  async updateLocation(id: number, updates: Partial<Location>) {
    const { data, error } = await supabase
      .from('locations')
      .update({ ...updates, ultima_actualizacion: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Location
  },

  // Delete location
  async deleteLocation(id: number) {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add waste type to location
  async addWasteType(locationId: number, wasteTypeId: number) {
    const { error } = await supabase
      .from('location_waste_types')
      .insert({ location_id: locationId, waste_type_id: wasteTypeId })

    if (error) throw error
  },

  // Remove waste type from location
  async removeWasteType(locationId: number, wasteTypeId: number) {
    const { error } = await supabase
      .from('location_waste_types')
      .delete()
      .eq('location_id', locationId)
      .eq('waste_type_id', wasteTypeId)

    if (error) throw error
  },

  // Get all waste types
  async getWasteTypes() {
    const { data, error } = await supabase
      .from('waste_types')
      .select('*')
      .order('categoria')
      .order('nombre')

    if (error) throw error
    return data as WasteType[]
  },

  // Get all provinces via cached API endpoint (24h CDN cache)
  async getCities() {
    try {
      const res = await fetch('/api/geography?type=provincias', { cache: 'force-cache' })
      if (!res.ok) throw new Error('Failed to fetch provinces')
      const { provincias } = await res.json()
      return provincias as string[]
    } catch {
      // Fallback: query directly
      const { data, error } = await supabase
        .from('panama_geography')
        .select('provincia')
        .order('provincia')
      if (error) throw error
      return [...new Set(data?.map((d) => d.provincia) ?? [])] as string[]
    }
  },

  // Get districts (municipios) for a province via cached API endpoint
  async getMunicipios(ciudad?: string) {
    if (!ciudad) return [] as string[]
    try {
      const res = await fetch(
        `/api/geography?type=distritos&provincia=${encodeURIComponent(ciudad)}`,
        { cache: 'force-cache' }
      )
      if (!res.ok) throw new Error('Failed to fetch districts')
      const { distritos } = await res.json()
      return distritos as string[]
    } catch {
      // Fallback: query directly
      const { data, error } = await supabase
        .from('panama_geography')
        .select('distrito')
        .eq('provincia', ciudad)
        .order('distrito')
      if (error) throw error
      return [...new Set(data?.map((d) => d.distrito) ?? [])] as string[]
    }
  },

  // FB-005: Create new waste type
  async createWasteType(name: string): Promise<WasteType> {
    const response = await fetch('/api/waste-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Failed to create waste type');
    }

    return await response.json();
  },
}
