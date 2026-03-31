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
  volumen: number
  peso_estimado: number
  costo_valor: number
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
  estado: string
  notas?: string
  created_at: string
  updated_at?: string
  location?: Pick<Location, 'id' | 'nombre_institucion' | 'ciudad' | 'municipio'>
  photos?: StockItemPhoto[]
}

export interface StockItemPhoto {
  id: number
  item_type: 'vehicle' | 'ac_unit' | 'tool'
  item_id: number
  file_name: string
  file_path: string
  file_size: number
  uploaded_by?: string
  created_at: string
  public_url?: string
}
