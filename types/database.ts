export type UserRole = 'admin' | 'operador' | 'viewer'
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_CREATE' | 'LOGIN' | 'LOGOUT'

export interface Profile {
  id: string
  email: string
  nombre: string
  rol: UserRole
  activo: boolean
  created_at: string
  updated_at?: string
}

export interface Location {
  id: number
  created_by?: string
  nombre_institucion: string
  direccion: string
  latitud: number
  longitud: number
  ciudad: string
  municipio: string
  corregimiento?: string
  contacto_responsable?: string // Deprecated, kept for backward compatibility
  telefono_responsable?: string
  email_responsable?: string
  nombre_responsable: string
  zona?: number | null
  ultima_actualizacion?: string
  created_at: string
  updated_at?: string
}

export interface WasteType {
  id: number
  nombre: string
  descripcion?: string
  categoria: string
  created_at: string
}

export interface LocationWasteType {
  id: number
  location_id: number
  waste_type_id: number
  created_at: string
}

export interface LocationDocument {
  id: number
  location_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by?: string
  uploaded_at: string
}

export interface AuditLog {
  id: number
  user_id?: string
  action: AuditAction
  entity_type: string
  entity_id?: number
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  created_at: string
}

export interface LocationWithDetails extends Location {
  waste_types?: WasteType[]
  documents?: LocationDocument[]
  created_by_name?: string
  created_by_email?: string
}

export interface WasteItem {
  id: number
  location_id: number
  waste_type_id: number
  subcategoria?: string | null
  volume: number
  weight: number
  value: number
  quality?: string | null
  created_at: string
  waste_type?: WasteType
  photos?: WasteItemPhoto[]
  photo_count?: number
}

export interface WasteItemPhoto {
  id: number
  waste_item_id: number
  file_name: string
  file_path: string
  file_size: number
  uploaded_by?: string
  created_at: string
  public_url?: string
}

export interface WasteItemWithLocation extends WasteItem {
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio' | 'direccion'>
}

export interface MarketPrice {
  id: number
  created_at: string
  updated_at?: string
  waste_type_id: number
  price_per_kg: number
  price_per_m3: number
  effective_date: string
  notes?: string
  waste_type?: WasteType
}

export type SaleListingStatus = 'draft' | 'active' | 'closed'
export type SaleInquiryStatus = 'sent' | 'opened' | 'responded'

export interface SaleListing {
  id: number
  created_by?: string
  location_id: number
  title: string
  status: SaleListingStatus
  notes?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  total_market_value: number
  total_suggested_price: number
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface SaleListingItem {
  id: number
  sale_listing_id: number
  waste_item_id?: number
  waste_type_id?: number
  weight_kg: number
  volume_m3: number
  quality?: string
  market_price_per_kg: number
  market_price_per_m3: number
  suggested_price: number
  custom_price?: number
  created_at: string
  waste_type?: WasteType
}

export interface SaleInquiry {
  id: number
  sale_listing_id: number
  buyer_name: string
  buyer_email: string
  buyer_phone?: string
  message?: string
  status: SaleInquiryStatus
  sent_at: string
  created_at: string
}

export interface SaleListingWithDetails extends SaleListing {
  location?: Location
  items?: SaleListingItem[]
  inquiries?: SaleInquiry[]
}

export interface StockVehicle {
  id: number
  location_id: number
  created_by?: string
  marca: string
  modelo: string
  anio: number
  placa: string
  numero_motor?: string
  numero_chasis?: string
  color?: string
  tipo_combustible?: string
  tipo_vehiculo?: string
  numero_poliza?: string
  fecha_vencimiento_poliza?: string
  fecha_revisado?: string
  frecuencia_mantenimiento?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  ubicacion_parroquia?: string
  tipo_activo?: string
  valor?: number
  tiene_avaluo?: boolean
  precio_avaluo?: number
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  codigo_marbete?: string
  estado: string
  notas?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  photos?: StockItemPhoto[]
}

export interface StockAcUnit {
  id: number
  location_id: number
  created_by?: string
  marca: string
  modelo: string
  numero_serie?: string
  capacidad_btu?: number
  tipo_ac?: string
  fecha_instalacion?: string
  fecha_ultimo_mantenimiento?: string
  frecuencia_mantenimiento?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  ubicacion_parroquia?: string
  tipo_activo?: string
  valor?: number
  tiene_avaluo?: boolean
  precio_avaluo?: number
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  codigo_marbete?: string
  estado: string
  notas?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  photos?: StockItemPhoto[]
}

export interface StockTool {
  id: number
  location_id: number
  created_by?: string
  nombre: string
  marca?: string
  modelo?: string
  numero_serie?: string
  tipo_herramienta?: string
  voltaje?: string
  potencia_watts?: number
  fecha_adquisicion?: string
  fecha_ultimo_mantenimiento?: string
  frecuencia_mantenimiento?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  ubicacion_parroquia?: string
  tipo_activo?: string
  valor?: number
  tiene_avaluo?: boolean
  precio_avaluo?: number
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  codigo_marbete?: string
  estado: string
  notas?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  photos?: StockItemPhoto[]
}

export interface StockFurniture {
  id: number
  location_id: number
  created_by?: string
  nombre: string
  marca?: string
  modelo?: string
  numero_serie?: string
  tipo_mueble?: string
  material?: string
  fecha_adquisicion?: string
  frecuencia_mantenimiento?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  ubicacion_parroquia?: string
  tipo_activo?: string
  valor?: number
  tiene_avaluo?: boolean
  precio_avaluo?: number
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  codigo_marbete?: string
  estado: string
  notas?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  photos?: StockItemPhoto[]
}

export interface StockElectronic {
  id: number
  location_id: number
  created_by?: string
  nombre: string
  marca?: string
  modelo?: string
  numero_serie?: string
  tipo_electronico?: string
  fecha_adquisicion?: string
  fecha_garantia?: string
  sistema_operativo?: string
  frecuencia_mantenimiento?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  ubicacion_parroquia?: string
  tipo_activo?: string
  valor?: number
  tiene_avaluo?: boolean
  precio_avaluo?: number
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  codigo_marbete?: string
  estado: string
  notas?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  photos?: StockItemPhoto[]
}

export interface StockItemPhoto {
  id: number
  item_type: 'vehicle' | 'ac_unit' | 'tool' | 'inmueble' | 'furniture' | 'electronic' | 'part'
  item_id: number
  file_name: string
  file_path: string
  file_size: number
  uploaded_by?: string
  created_at: string
  public_url?: string
}

export type PartCategory = 'vehicle' | 'ac_unit' | 'tool' | 'furniture' | 'electronic'

export interface PartType {
  id: number
  category: PartCategory
  nombre: string
  created_by_user: boolean
  created_at: string
}

export interface StockPart {
  id: number
  part_type_id: number
  location_id: number
  marbete_id?: number
  marca?: string
  modelo?: string
  cantidad: number
  estado: string
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  codigo_marbete?: string
  notas?: string
  created_by?: string
  created_at: string
  updated_at?: string
  part_type?: PartType
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
}

export interface Marbete {
  id: number
  codigo: string
  category: PartCategory
  location_id: number
  marca?: string
  modelo?: string
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  notas?: string
  created_by?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  parts?: StockPart[]
  parts_count?: number
}

export type VehiclePart = StockPart
export type AcUnitPart = StockPart
export type ToolPart = StockPart

export type TipoSalida = 'Venta' | 'Donación' | 'Traspaso' | 'Permuta' | 'Subasta' | 'Descarte'

export interface StockExit {
  id: number
  item_type: 'vehicle' | 'ac_unit' | 'tool' | 'inmueble' | 'part'
  item_id: number
  location_id: number
  tipo_salida: TipoSalida
  valor_venta?: number
  descripcion?: string
  fecha_salida: string
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  created_by?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  // Populated from joined stock item
  item_detail?: {
    marca: string
    modelo: string
    placa?: string
    numero_serie?: string
    tipo_activo?: string
  }
}

export interface InmuebleType {
  id: number
  nombre: string
  created_by_user: boolean
  created_at: string
}

export interface InmuebleActivoType {
  id: number
  nombre: string
  created_by_user: boolean
  created_at: string
}

export interface StockInmueble {
  id: number
  location_id: number
  created_by?: string
  nombre: string
  inmueble_type_id: number
  activo_type_id?: number
  valor?: number
  // Desglose de valores
  valor_terreno?: number
  valor_catastral?: number
  valor_mejoras?: number
  // Cache del avalúo vigente (mantenido por trigger)
  avaluo_vigente_monto?: number
  avaluo_vigente_fecha?: string
  metros_cuadrados?: number
  avaluo?: string
  registro?: string
  planos_actualizados?: string
  codigo_marbete?: string
  // Titular registral + ministerio
  titular_nombre?: string
  titular_tipo?: string // 'Estado' | 'Persona natural' | 'Persona jurídica' | 'Ministerio'
  ministerio?: string
  responsable_nombre?: string
  responsable_telefono?: string
  responsable_email?: string
  ubicacion_nombre?: string
  ubicacion_direccion?: string
  ubicacion_municipio?: string
  ubicacion_ciudad?: string
  estado: string
  notas?: string
  created_at: string
  updated_at?: string
  inmueble_type?: InmuebleType
  activo_type?: InmuebleActivoType
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  photos?: StockItemPhoto[]
  // Relaciones / datos derivados (radiografía y completitud)
  avaluos?: InmuebleAvaluo[]
  documents?: InmuebleDocument[]
  media?: InmuebleMedia[]
  completitud?: InmuebleCompletitud
  incidencias?: IncidenciaTipo[]
}

export interface InmuebleAvaluo {
  id: number
  inmueble_id: number
  monto: number
  fecha_avaluo: string
  anio?: number
  entidad_avaluadora?: string
  documento_path?: string
  documento_nombre?: string
  notas?: string
  es_actual: boolean
  created_by?: string
  created_at: string
  updated_at?: string
  public_url?: string
}

export interface InmuebleDocumentType {
  id: number
  nombre: string
  created_by_user: boolean
  is_required: boolean
  orden: number
  created_at?: string
}

export interface InmuebleDocument {
  id: number
  inmueble_id: number
  document_type_id: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by?: string
  created_at: string
  public_url?: string
  document_type?: InmuebleDocumentType
}

export type InmuebleMediaCategoria =
  | 'Fachada' | 'Interiores' | 'Áreas comunes' | 'Pasillos' | 'Elevadores' | 'Vista aérea' | 'Otra'

export interface InmuebleMedia {
  id: number
  inmueble_id: number
  media_type: 'image' | 'video'
  categoria: InmuebleMediaCategoria
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by?: string
  created_at: string
  public_url?: string
}

export interface InmuebleCompletitud {
  tiene_avaluo_vigente: boolean
  fecha_avaluo_vigente?: string | null
  tiene_plano_catastral: boolean
  tiene_escritura: boolean
  tiene_planos_arq: boolean
  tiene_titular: boolean
  titular_es_persona_natural: boolean
  tiene_valor_mejoras: boolean
}

export type IncidenciaTipo =
  | 'sin_avaluo_vigente'
  | 'avaluo_desactualizado'
  | 'sin_plano_catastral'
  | 'sin_escritura'
  | 'sin_planos_arquitectonicos'
  | 'sin_titular_registral'
  | 'titular_persona_natural'
  | 'sin_valor_mejoras'

export interface RadiografiaReport {
  scope: { total_inmuebles: number }
  incidencias_por_tipo: { tipo: IncidenciaTipo; count: number }[]
  inmuebles: {
    id: number
    nombre: string
    tipo?: string
    nombre_institucion?: string
    incidencias: IncidenciaTipo[]
  }[]
}
