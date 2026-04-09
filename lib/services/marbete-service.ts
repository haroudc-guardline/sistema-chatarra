import type { Marbete, PartCategory } from '@/types/database'

function buildParams(filters: Record<string, string | number | undefined>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  return params
}

export interface MarbeteSearchFilters {
  category?: PartCategory
  search?: string
  location_id?: number
  page?: number
  limit?: number
}

export interface CreateMarbeteData {
  codigo: string
  category: PartCategory
  location_id: number
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  notas?: string
  parts?: PartInput[]
}

export interface PartInput {
  part_type_id: number
  marca?: string
  modelo?: string
  cantidad: number
  estado: string
  notas?: string
}

export const marbeteService = {
  async searchMarbetes(filters: MarbeteSearchFilters): Promise<{ data: Marbete[]; count: number }> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-items/marbetes?${params}`)
    if (!res.ok) throw new Error('Error al buscar marbetes')
    return res.json()
  },

  async getMarbete(id: number): Promise<Marbete> {
    const res = await fetch(`/api/stock-items/marbetes/${id}`)
    if (!res.ok) throw new Error('Error al obtener marbete')
    return res.json()
  },

  async createMarbete(data: CreateMarbeteData): Promise<Marbete> {
    const res = await fetch('/api/stock-items/marbetes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear marbete')
    }
    return res.json()
  },

  async updateMarbete(id: number, data: Partial<Marbete>): Promise<Marbete> {
    const res = await fetch(`/api/stock-items/marbetes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar marbete')
    }
    return res.json()
  },

  async deleteMarbete(id: number): Promise<void> {
    const res = await fetch(`/api/stock-items/marbetes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar marbete')
    }
  },

  async addPartsToMarbete(marbeteId: number, parts: PartInput[]): Promise<{ parts: unknown[] }> {
    const res = await fetch(`/api/stock-items/marbetes/${marbeteId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parts }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al agregar piezas')
    }
    return res.json()
  },
}
