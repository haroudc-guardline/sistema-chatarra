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

    // Filter by waste types: check BOTH location_waste_types (explicit associations)
    // AND waste_items (actual inventory entries) so the filter works even when
    // location_waste_types hasn't been populated yet for a location.
    if (filters?.wasteTypeIds && filters.wasteTypeIds.length > 0) {
      const [lwtResult, wiResult] = await Promise.all([
        supabase
          .from('location_waste_types')
          .select('location_id')
          .in('waste_type_id', filters.wasteTypeIds),
        supabase
          .from('waste_items')
          .select('location_id')
          .in('waste_type_id', filters.wasteTypeIds),
      ])

      if (lwtResult.error) throw lwtResult.error
      if (wiResult.error) throw wiResult.error

      const fromLwt = (lwtResult.data ?? []).map((r) => r.location_id)
      const fromWi = (wiResult.data ?? []).map((r) => r.location_id)
      const matchingIds = [...new Set([...fromLwt, ...fromWi])]

      if (matchingIds.length === 0) {
        return [] as LocationWithDetails[]
      }

      query = query.in('id', matchingIds)
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
    // contacto_responsable is a legacy column — keep it in sync with telefono_responsable
    const payload = {
      ...location,
      contacto_responsable: location.telefono_responsable ?? location.contacto_responsable ?? '',
    }
    const { data, error } = await supabase
      .from('locations')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Location
  },

  // Update location
  async updateLocation(id: number, updates: Partial<Location>) {
    const payload = {
      ...updates,
      ultima_actualizacion: new Date().toISOString(),
      // Keep legacy column in sync if telefono_responsable is being updated
      ...(updates.telefono_responsable !== undefined && {
        contacto_responsable: updates.telefono_responsable ?? '',
      }),
    }
    const { data, error } = await supabase
      .from('locations')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
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

  // Get all provinces — tries cached API first, falls back to direct Supabase query
  async getCities() {
    try {
      const res = await fetch('/api/geography?type=provincias')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { provincias } = await res.json()
      // If the API returned an empty list, fall through to direct query
      if (Array.isArray(provincias) && provincias.length > 0) {
        return provincias as string[]
      }
      throw new Error('Empty response from API')
    } catch {
      // Fallback: query directly using the authenticated browser client
      const { data, error } = await supabase
        .from('panama_geography')
        .select('provincia')
        .order('provincia')
      if (error) throw error
      return [...new Set(data?.map((d) => d.provincia) ?? [])] as string[]
    }
  },

  // Get districts (municipios) for a province — tries cached API first
  async getMunicipios(ciudad?: string) {
    if (!ciudad) return [] as string[]
    try {
      const res = await fetch(
        `/api/geography?type=distritos&provincia=${encodeURIComponent(ciudad)}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { distritos } = await res.json()
      if (Array.isArray(distritos) && distritos.length > 0) {
        return distritos as string[]
      }
      throw new Error('Empty response from API')
    } catch {
      // Fallback: query directly using the authenticated browser client
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
