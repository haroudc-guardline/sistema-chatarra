import type { StockVehicle, StockAcUnit, StockTool, StockItemPhoto } from '@/types/database'

// ─── Vehicles ────────────────────────────────────────────────────────────────

export interface VehicleSearchFilters {
  location_id?: number
  estado?: string
  tipo_vehiculo?: string
  tipo_combustible?: string
  tipo_activo?: string
  nombre_institucion?: string
  search?: string
  municipio?: string
  page?: number
  limit?: number
}

export interface AcUnitSearchFilters {
  location_id?: number
  estado?: string
  tipo_ac?: string
  tipo_activo?: string
  nombre_institucion?: string
  search?: string
  municipio?: string
  page?: number
  limit?: number
}

export interface ToolSearchFilters {
  location_id?: number
  estado?: string
  tipo_herramienta?: string
  tipo_activo?: string
  nombre_institucion?: string
  search?: string
  municipio?: string
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

export const stockItemService = {
  // Vehicles
  async searchVehicles(filters: VehicleSearchFilters): Promise<{ data: StockVehicle[]; count: number }> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-items/autos?${params}`)
    if (!res.ok) throw new Error('Error al buscar vehículos')
    return res.json()
  },

  async createVehicle(data: Partial<StockVehicle>): Promise<StockVehicle> {
    const res = await fetch('/api/stock-items/autos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear vehículo')
    }
    return res.json()
  },

  async updateVehicle(id: number, data: Partial<StockVehicle>): Promise<StockVehicle> {
    const res = await fetch(`/api/stock-items/autos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar vehículo')
    }
    return res.json()
  },

  async getVehicle(id: number): Promise<StockVehicle> {
    const res = await fetch(`/api/stock-items/autos/${id}`)
    if (!res.ok) throw new Error('Error al obtener vehículo')
    return res.json()
  },

  async deleteVehicle(id: number): Promise<void> {
    const res = await fetch(`/api/stock-items/autos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar vehículo')
    }
  },

  // AC Units
  async searchAcUnits(filters: AcUnitSearchFilters): Promise<{ data: StockAcUnit[]; count: number }> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-items/aires?${params}`)
    if (!res.ok) throw new Error('Error al buscar aires acondicionados')
    return res.json()
  },

  async createAcUnit(data: Partial<StockAcUnit>): Promise<StockAcUnit> {
    const res = await fetch('/api/stock-items/aires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear aire acondicionado')
    }
    return res.json()
  },

  async updateAcUnit(id: number, data: Partial<StockAcUnit>): Promise<StockAcUnit> {
    const res = await fetch(`/api/stock-items/aires/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar aire acondicionado')
    }
    return res.json()
  },

  async getAcUnit(id: number): Promise<StockAcUnit> {
    const res = await fetch(`/api/stock-items/aires/${id}`)
    if (!res.ok) throw new Error('Error al obtener aire acondicionado')
    return res.json()
  },

  async deleteAcUnit(id: number): Promise<void> {
    const res = await fetch(`/api/stock-items/aires/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar aire acondicionado')
    }
  },

  // Tools
  async searchTools(filters: ToolSearchFilters): Promise<{ data: StockTool[]; count: number }> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-items/herramientas?${params}`)
    if (!res.ok) throw new Error('Error al buscar herramientas')
    return res.json()
  },

  async createTool(data: Partial<StockTool>): Promise<StockTool> {
    const res = await fetch('/api/stock-items/herramientas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear herramienta')
    }
    return res.json()
  },

  async updateTool(id: number, data: Partial<StockTool>): Promise<StockTool> {
    const res = await fetch(`/api/stock-items/herramientas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar herramienta')
    }
    return res.json()
  },

  async getTool(id: number): Promise<StockTool> {
    const res = await fetch(`/api/stock-items/herramientas/${id}`)
    if (!res.ok) throw new Error('Error al obtener herramienta')
    return res.json()
  },

  async deleteTool(id: number): Promise<void> {
    const res = await fetch(`/api/stock-items/herramientas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar herramienta')
    }
  },

  // Photos
  async uploadPhotos(itemType: 'vehicle' | 'ac_unit' | 'tool' | 'inmueble', itemId: number, files: File[]): Promise<StockItemPhoto[]> {
    const formData = new FormData()
    formData.append('item_type', itemType)
    formData.append('item_id', itemId.toString())
    files.forEach((file) => formData.append('files', file))
    const res = await fetch('/api/stock-items/photos', { method: 'POST', body: formData })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al subir fotos')
    }
    return res.json()
  },

  async deletePhoto(photoId: number): Promise<void> {
    const res = await fetch(`/api/stock-items/photos?photoId=${photoId}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar foto')
    }
  },

  async getPhotos(itemType: 'vehicle' | 'ac_unit' | 'tool', itemId: number): Promise<StockItemPhoto[]> {
    const res = await fetch(`/api/stock-items/photos?item_type=${itemType}&item_id=${itemId}`)
    if (!res.ok) throw new Error('Error al obtener fotos')
    return res.json()
  },
}
