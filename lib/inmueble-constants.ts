import type { IncidenciaTipo, InmuebleMediaCategoria } from '@/types/database'

/** Etiqueta legible para cada tipo de incidencia de la radiografía. */
export const INCIDENCIA_LABELS: Record<IncidenciaTipo, string> = {
  sin_avaluo_vigente: 'Sin avalúo vigente',
  avaluo_desactualizado: 'Avalúo desactualizado',
  sin_plano_catastral: 'Sin plano catastral',
  sin_escritura: 'Sin escritura pública',
  sin_planos_arquitectonicos: 'Sin planos arquitectónicos',
  sin_titular_registral: 'Sin titular registral',
  titular_persona_natural: 'Titular es persona natural',
  sin_valor_mejoras: 'Sin valor de mejoras',
}

/** Incidencias ofrecidas como filtro multi-selección "Pendiente por…" en el listado. */
export const PENDIENTE_FILTER_OPTIONS: IncidenciaTipo[] = [
  'sin_avaluo_vigente',
  'avaluo_desactualizado',
  'sin_plano_catastral',
  'sin_escritura',
  'sin_planos_arquitectonicos',
  'sin_titular_registral',
  'titular_persona_natural',
  'sin_valor_mejoras',
]

export const TITULAR_TIPOS = ['Estado', 'Persona natural', 'Persona jurídica', 'Ministerio'] as const

export const MEDIA_CATEGORIAS: InmuebleMediaCategoria[] = [
  'Fachada', 'Interiores', 'Áreas comunes', 'Pasillos', 'Elevadores', 'Vista aérea', 'Otra',
]
