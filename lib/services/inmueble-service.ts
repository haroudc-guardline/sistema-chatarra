import type { StockInmueble, InmuebleType, InmuebleActivoType } from '@/types/database'

export interface InmuebleSearchFilters {
  inmueble_type_id?: number
  activo_type_id?: number
  avaluo?: string
  registro?: string
  search?: string
  ciudad?: string
  municipio?: string
  nombre_institucion?: string
  page?: number
  limit?: number
}

function buildParams(filters: Record<string, string | number | undefined>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  return params
}

export const inmuebleService = {
  // Inmuebles
  async searchInmuebles(filters: InmuebleSearchFilters): Promise<{ data: StockInmueble[]; count: number }> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-items/inmuebles?${params}`)
    if (!res.ok) throw new Error('Error al buscar inmuebles')
    return res.json()
  },

  async createInmueble(data: Partial<StockInmueble>): Promise<StockInmueble> {
    const res = await fetch('/api/stock-items/inmuebles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear inmueble')
    }
    return res.json()
  },

  async updateInmueble(id: number, data: Partial<StockInmueble>): Promise<StockInmueble> {
    const res = await fetch(`/api/stock-items/inmuebles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar inmueble')
    }
    return res.json()
  },

  async deleteInmueble(id: number): Promise<void> {
    const res = await fetch(`/api/stock-items/inmuebles/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar inmueble')
    }
  },

  // Inmueble Types
  async getInmuebleTypes(): Promise<InmuebleType[]> {
    const res = await fetch('/api/stock-items/inmueble-types')
    if (!res.ok) throw new Error('Error al obtener tipos de inmueble')
    return res.json()
  },

  async createInmuebleType(nombre: string): Promise<InmuebleType> {
    const res = await fetch('/api/stock-items/inmueble-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear tipo de inmueble')
    }
    return res.json()
  },

  // Activo Types
  async getActivoTypes(): Promise<InmuebleActivoType[]> {
    const res = await fetch('/api/stock-items/inmueble-activo-types')
    if (!res.ok) throw new Error('Error al obtener tipos de activo')
    return res.json()
  },

  async createActivoType(nombre: string): Promise<InmuebleActivoType> {
    const res = await fetch('/api/stock-items/inmueble-activo-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear tipo de activo')
    }
    return res.json()
  },
}
