export const ZONES = [
  { id: 1, label: 'Zona 1 - Central', provincias: ['Panamá', 'Panamá Oeste', 'Colón', 'Darién'] },
  { id: 2, label: 'Zona 2 - Interior', provincias: ['Veraguas', 'Coclé', 'Herrera', 'Los Santos'] },
  { id: 3, label: 'Zona 3 - Occidente', provincias: ['Chiriquí', 'Bocas del Toro'] },
]

export function getZoneForCity(ciudad: string): number | null {
  const zone = ZONES.find(z => z.provincias.includes(ciudad))
  return zone?.id ?? null
}

export function getZoneLabel(zonaId: number): string {
  return ZONES.find(z => z.id === zonaId)?.label ?? `Zona ${zonaId}`
}

export function getCitiesForZone(zonaId: number): string[] {
  return ZONES.find(z => z.id === zonaId)?.provincias ?? []
}
