import type { StockPart, PartType, PartCategory } from '@/types/database'

// Map category to API path
const CATEGORY_PATH: Record<PartCategory, string> = {
  vehicle: 'autos',
  ac_unit: 'aires',
  tool: 'herramientas',
  furniture: 'mobiliario',
  electronic: 'electronicos',
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

export interface PartSearchFilters {
  location_id?: number
  part_type_id?: number
  estado?: string
  search?: string
  municipio?: string
  page?: number
  limit?: number
}

export const partsService = {
  // Part Types
  async getPartTypes(category: PartCategory): Promise<PartType[]> {
    const res = await fetch(`/api/stock-items/part-types?category=${category}`)
    if (!res.ok) throw new Error('Error al obtener tipos de pieza')
    return res.json()
  },

  async createPartType(category: PartCategory, nombre: string): Promise<PartType> {
    const res = await fetch('/api/stock-items/part-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, nombre }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear tipo de pieza')
    }
    return res.json()
  },

  // Parts CRUD
  async searchParts(category: PartCategory, filters: PartSearchFilters): Promise<{ data: StockPart[]; count: number }> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const path = CATEGORY_PATH[category]
    const res = await fetch(`/api/stock-items/parts/${path}?${params}`)
    if (!res.ok) throw new Error('Error al buscar piezas')
    return res.json()
  },

  async createPart(category: PartCategory, data: Partial<StockPart>): Promise<StockPart> {
    const path = CATEGORY_PATH[category]
    const res = await fetch(`/api/stock-items/parts/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear pieza')
    }
    return res.json()
  },

  async updatePart(category: PartCategory, id: number, data: Partial<StockPart>): Promise<StockPart> {
    const path = CATEGORY_PATH[category]
    const res = await fetch(`/api/stock-items/parts/${path}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar pieza')
    }
    return res.json()
  },

  async deletePart(category: PartCategory, id: number): Promise<void> {
    const path = CATEGORY_PATH[category]
    const res = await fetch(`/api/stock-items/parts/${path}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar pieza')
    }
  },
}
