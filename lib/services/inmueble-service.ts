import type {
  StockInmueble, InmuebleType, InmuebleActivoType,
  InmuebleAvaluo, InmuebleDocument, InmuebleDocumentType, InmuebleMedia, RadiografiaReport,
} from '@/types/database'

export interface InmuebleSearchFilters {
  inmueble_type_id?: number
  activo_type_id?: number
  avaluo?: string
  registro?: string
  planos_actualizados?: string
  search?: string
  ciudad?: string
  municipio?: string
  nombre_institucion?: string
  /** CSV de incidencias para el filtro multi-selección "Pendiente por…" */
  pendiente?: string
  anios_avaluo?: number
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

  async getInmueble(id: number): Promise<StockInmueble> {
    const res = await fetch(`/api/stock-items/inmuebles/${id}`)
    if (!res.ok) throw new Error('Error al obtener inmueble')
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

  // ===== Avalúos (historial) =====
  async getAvaluos(inmuebleId: number): Promise<InmuebleAvaluo[]> {
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/avaluos`)
    if (!res.ok) throw new Error('Error al obtener avalúos')
    return res.json()
  },

  async createAvaluo(inmuebleId: number, data: {
    monto: number; fecha_avaluo: string; entidad_avaluadora?: string; notas?: string; es_actual?: boolean; documento?: File | null
  }): Promise<InmuebleAvaluo> {
    const fd = new FormData()
    fd.set('monto', String(data.monto))
    fd.set('fecha_avaluo', data.fecha_avaluo)
    if (data.entidad_avaluadora) fd.set('entidad_avaluadora', data.entidad_avaluadora)
    if (data.notas) fd.set('notas', data.notas)
    if (data.es_actual != null) fd.set('es_actual', String(data.es_actual))
    if (data.documento) fd.set('documento', data.documento)
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/avaluos`, { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al registrar avalúo')
    }
    return res.json()
  },

  async updateAvaluo(inmuebleId: number, avaluoId: number, data: Partial<InmuebleAvaluo>): Promise<InmuebleAvaluo> {
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/avaluos/${avaluoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar avalúo')
    }
    return res.json()
  },

  async deleteAvaluo(inmuebleId: number, avaluoId: number): Promise<void> {
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/avaluos/${avaluoId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar avalúo')
  },

  // ===== Documentos + tipos =====
  async getDocumentTypes(): Promise<InmuebleDocumentType[]> {
    const res = await fetch('/api/stock-items/inmueble-document-types')
    if (!res.ok) throw new Error('Error al obtener tipos de documento')
    return res.json()
  },

  async createDocumentType(nombre: string): Promise<InmuebleDocumentType> {
    const res = await fetch('/api/stock-items/inmueble-document-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear tipo de documento')
    }
    return res.json()
  },

  async getDocuments(inmuebleId: number): Promise<InmuebleDocument[]> {
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/documents`)
    if (!res.ok) throw new Error('Error al obtener documentos')
    return res.json()
  },

  async uploadDocuments(inmuebleId: number, documentTypeId: number, files: File[]): Promise<InmuebleDocument[]> {
    const fd = new FormData()
    fd.set('document_type_id', String(documentTypeId))
    files.forEach((f) => fd.append('files', f))
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/documents`, { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al subir documento')
    }
    return res.json()
  },

  async deleteDocument(inmuebleId: number, documentId: number): Promise<void> {
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/documents?documentId=${documentId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar documento')
  },

  // ===== Media (fotos / video por categoría) =====
  async getMedia(inmuebleId: number): Promise<InmuebleMedia[]> {
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/media`)
    if (!res.ok) throw new Error('Error al obtener galería')
    return res.json()
  },

  async uploadMedia(inmuebleId: number, categoria: string, files: File[]): Promise<InmuebleMedia[]> {
    const fd = new FormData()
    fd.set('categoria', categoria)
    files.forEach((f) => fd.append('files', f))
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/media`, { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al subir archivo')
    }
    return res.json()
  },

  async deleteMedia(inmuebleId: number, mediaId: number): Promise<void> {
    const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/media?mediaId=${mediaId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar archivo')
  },

  // ===== Radiografía =====
  async getRadiografia(filters: { inmueble_type_id?: number; ciudad?: string; municipio?: string; nombre_institucion?: string; anios_avaluo?: number } = {}): Promise<RadiografiaReport> {
    const params = buildParams(filters as Record<string, string | number | undefined>)
    const res = await fetch(`/api/stock-items/inmuebles/radiografia?${params}`)
    if (!res.ok) throw new Error('Error al obtener la radiografía')
    return res.json()
  },
}
