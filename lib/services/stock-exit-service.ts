import type { StockExit } from '@/types/database'

export interface StockExitFilters {
  item_type?: string
  tipo_salida?: string
  nombre_institucion?: string
  search?: string
  page?: number
  limit?: number
}

export interface StockItemSearchParams {
  category?: string
  search?: string
  location_id?: number
}

export interface StockItemSearchResult {
  id: number
  item_type: string
  marca: string
  modelo: string
  identifier: string
  tipo_activo: string
  valor: number
  location_name: string
  location_id: number
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

export const stockExitService = {
  async searchExits(filters: StockExitFilters): Promise<{ data: StockExit[]; count: number }> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-exits?${params}`)
    if (!res.ok) throw new Error('Error al buscar salidas de stock')
    return res.json()
  },

  async createExit(data: Partial<StockExit>): Promise<StockExit> {
    const res = await fetch('/api/stock-exits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear salida de stock')
    }
    return res.json()
  },

  async updateExit(id: number, data: Partial<StockExit>): Promise<StockExit> {
    const res = await fetch(`/api/stock-exits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar salida de stock')
    }
    return res.json()
  },

  async deleteExit(id: number): Promise<void> {
    const res = await fetch(`/api/stock-exits/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar salida de stock')
    }
  },

  async searchStockItems(params: StockItemSearchParams): Promise<StockItemSearchResult[]> {
    const urlParams = buildParams(params as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-exits/search?${urlParams}`)
    if (!res.ok) throw new Error('Error al buscar items de stock')
    return res.json()
  },
}
