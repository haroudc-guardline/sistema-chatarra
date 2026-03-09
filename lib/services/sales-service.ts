import { supabase } from '@/lib/supabase/client'
import type {
  SaleListing,
  SaleListingWithDetails,
  SaleListingItem,
  SaleInquiry,
  MarketPrice,
  WasteItem,
} from '@/types/database'

// Quality multiplier applied to market price for suggested price calculation
const QUALITY_FACTORS: Record<string, number> = {
  alta: 1.0,
  media: 0.8,
  baja: 0.6,
}
const DEFAULT_QUALITY_FACTOR = 0.7

export function getQualityFactor(quality?: string | null): number {
  if (!quality) return DEFAULT_QUALITY_FACTOR
  return QUALITY_FACTORS[quality.toLowerCase()] ?? DEFAULT_QUALITY_FACTOR
}

/**
 * Calculate the suggested price for a waste item given market prices.
 * Uses the higher of weight-based or volume-based calculation.
 */
export function calcSuggestedPrice(
  weightKg: number,
  volumeM3: number,
  pricePerKg: number,
  pricePerM3: number,
  quality?: string | null
): number {
  const factor = getQualityFactor(quality)
  const byWeight = weightKg * pricePerKg * factor
  const byVolume = volumeM3 * pricePerM3 * factor
  return Math.max(byWeight, byVolume)
}

export const salesService = {
  // ------------------------------------------------------------------
  // LISTINGS
  // ------------------------------------------------------------------

  async getListings(filters?: { status?: string; locationId?: number }) {
    let query = supabase
      .from('sale_listings')
      .select(`
        *,
        location:locations(id, nombre_institucion, ciudad, municipio, direccion)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.locationId) {
      query = query.eq('location_id', filters.locationId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data as SaleListingWithDetails[]
  },

  async getListingById(id: number) {
    const { data, error } = await supabase
      .from('sale_listings')
      .select(`
        *,
        location:locations(id, nombre_institucion, ciudad, municipio, direccion, nombre_responsable, email_responsable, telefono_responsable),
        items:sale_listing_items(*, waste_type:waste_types(id, nombre, categoria)),
        inquiries:sale_inquiries(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data as SaleListingWithDetails
  },

  async createListing(
    listing: Omit<SaleListing, 'id' | 'created_at' | 'updated_at' | 'total_market_value' | 'total_suggested_price'>,
    items: Array<{
      waste_item_id?: number
      waste_type_id?: number
      weight_kg: number
      volume_m3: number
      quality?: string | null
      market_price_per_kg: number
      market_price_per_m3: number
    }>
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Calculate totals
    const itemsWithPrices = items.map((item) => ({
      ...item,
      suggested_price: calcSuggestedPrice(
        item.weight_kg,
        item.volume_m3,
        item.market_price_per_kg,
        item.market_price_per_m3,
        item.quality
      ),
    }))

    const totalMarketValue = itemsWithPrices.reduce(
      (sum, item) =>
        sum +
        Math.max(
          item.weight_kg * item.market_price_per_kg,
          item.volume_m3 * item.market_price_per_m3
        ),
      0
    )

    const totalSuggestedPrice = itemsWithPrices.reduce(
      (sum, item) => sum + item.suggested_price,
      0
    )

    // Insert listing
    const { data: created, error: listingError } = await supabase
      .from('sale_listings')
      .insert({
        ...listing,
        created_by: user.id,
        total_market_value: totalMarketValue,
        total_suggested_price: totalSuggestedPrice,
      })
      .select()
      .single()

    if (listingError) throw new Error(listingError.message)

    // Insert line items
    if (itemsWithPrices.length > 0) {
      const { error: itemsError } = await supabase
        .from('sale_listing_items')
        .insert(
          itemsWithPrices.map((item) => ({
            sale_listing_id: created.id,
            waste_item_id: item.waste_item_id ?? null,
            waste_type_id: item.waste_type_id ?? null,
            weight_kg: item.weight_kg,
            volume_m3: item.volume_m3,
            quality: item.quality ?? null,
            market_price_per_kg: item.market_price_per_kg,
            market_price_per_m3: item.market_price_per_m3,
            suggested_price: item.suggested_price,
          }))
        )

      if (itemsError) throw new Error(itemsError.message)
    }

    return created as SaleListing
  },

  async updateListingStatus(id: number, status: 'draft' | 'active' | 'closed') {
    const { data, error } = await supabase
      .from('sale_listings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as SaleListing
  },

  async deleteListing(id: number) {
    const { error } = await supabase
      .from('sale_listings')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  // ------------------------------------------------------------------
  // MARKET PRICES
  // ------------------------------------------------------------------

  async getMarketPrices() {
    const { data, error } = await supabase
      .from('market_prices')
      .select('*, waste_type:waste_types(id, nombre, categoria)')
      .order('waste_type_id')

    if (error) throw new Error(error.message)
    return data as MarketPrice[]
  },

  async updateMarketPrice(
    id: number,
    updates: { price_per_kg?: number; price_per_m3?: number; notes?: string }
  ) {
    const { data, error } = await supabase
      .from('market_prices')
      .update({ ...updates, updated_at: new Date().toISOString(), effective_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as MarketPrice
  },

  // ------------------------------------------------------------------
  // WASTE ITEMS for a location (to pre-fill listing items)
  // ------------------------------------------------------------------

  async getWasteItemsForLocation(locationId: number) {
    const { data, error } = await supabase
      .from('waste_items')
      .select('*, waste_type:waste_types(id, nombre, categoria)')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as WasteItem[]
  },

  // ------------------------------------------------------------------
  // INQUIRIES
  // ------------------------------------------------------------------

  async createInquiry(
    inquiry: Omit<SaleInquiry, 'id' | 'created_at' | 'sent_at' | 'status'>
  ) {
    const { data, error } = await supabase
      .from('sale_inquiries')
      .insert({ ...inquiry, status: 'sent', sent_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as SaleInquiry
  },
}
