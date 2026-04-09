import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function createSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

interface UnifiedResult {
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

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const locationId = searchParams.get('location_id')

  const results: UnifiedResult[] = []

  const shouldQueryVehicles = !category || category === 'vehicle'
  const shouldQueryAcUnits = !category || category === 'ac_unit'
  const shouldQueryTools = !category || category === 'tool'
  const shouldQueryInmuebles = !category || category === 'inmueble'
  const shouldQueryParts = !category || category === 'part'

  // Query vehicles
  if (shouldQueryVehicles) {
    let q = supabase
      .from('stock_vehicles')
      .select('id, marca, modelo, placa, tipo_activo, valor, location_id, location:locations(nombre_institucion)')
      .limit(50)

    if (search) q = q.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,placa.ilike.%${search}%`)
    if (locationId) q = q.eq('location_id', parseInt(locationId))

    const { data } = await q
    if (data) {
      results.push(
        ...data.map((v: Record<string, unknown>) => ({
          id: v.id as number,
          item_type: 'vehicle',
          marca: (v.marca as string) ?? '',
          modelo: (v.modelo as string) ?? '',
          identifier: (v.placa as string) ?? '',
          tipo_activo: (v.tipo_activo as string) ?? '',
          valor: (v.valor as number) ?? 0,
          location_name: ((v.location as Record<string, unknown>)?.nombre_institucion as string) ?? '',
          location_id: v.location_id as number,
        }))
      )
    }
  }

  // Query AC units
  if (shouldQueryAcUnits) {
    let q = supabase
      .from('stock_ac_units')
      .select('id, marca, modelo, numero_serie, tipo_activo, valor, location_id, location:locations(nombre_institucion)')
      .limit(50)

    if (search) q = q.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,numero_serie.ilike.%${search}%`)
    if (locationId) q = q.eq('location_id', parseInt(locationId))

    const { data } = await q
    if (data) {
      results.push(
        ...data.map((a: Record<string, unknown>) => ({
          id: a.id as number,
          item_type: 'ac_unit',
          marca: (a.marca as string) ?? '',
          modelo: (a.modelo as string) ?? '',
          identifier: (a.numero_serie as string) ?? '',
          tipo_activo: (a.tipo_activo as string) ?? '',
          valor: (a.valor as number) ?? 0,
          location_name: ((a.location as Record<string, unknown>)?.nombre_institucion as string) ?? '',
          location_id: a.location_id as number,
        }))
      )
    }
  }

  // Query tools
  if (shouldQueryTools) {
    let q = supabase
      .from('stock_tools')
      .select('id, nombre, marca, modelo, numero_serie, tipo_activo, valor, location_id, location:locations(nombre_institucion)')
      .limit(50)

    if (search) q = q.or(`nombre.ilike.%${search}%,marca.ilike.%${search}%,modelo.ilike.%${search}%`)
    if (locationId) q = q.eq('location_id', parseInt(locationId))

    const { data } = await q
    if (data) {
      results.push(
        ...data.map((t: Record<string, unknown>) => ({
          id: t.id as number,
          item_type: 'tool',
          marca: (t.marca as string) ?? (t.nombre as string) ?? '',
          modelo: (t.modelo as string) ?? '',
          identifier: (t.numero_serie as string) ?? '',
          tipo_activo: (t.tipo_activo as string) ?? '',
          valor: (t.valor as number) ?? 0,
          location_name: ((t.location as Record<string, unknown>)?.nombre_institucion as string) ?? '',
          location_id: t.location_id as number,
        }))
      )
    }
  }

  // Query inmuebles
  if (shouldQueryInmuebles) {
    let q = supabase
      .from('stock_inmuebles')
      .select('id, nombre, valor, location_id, inmueble_type:inmueble_types(nombre), location:locations(nombre_institucion)')
      .limit(50)

    if (search) q = q.ilike('nombre', `%${search}%`)
    if (locationId) q = q.eq('location_id', parseInt(locationId))

    const { data } = await q
    if (data) {
      results.push(
        ...data.map((i: Record<string, unknown>) => ({
          id: i.id as number,
          item_type: 'inmueble',
          marca: (i.nombre as string) ?? '',
          modelo: ((i.inmueble_type as Record<string, unknown>)?.nombre as string) ?? '',
          identifier: '',
          tipo_activo: '',
          valor: (i.valor as number) ?? 0,
          location_name: ((i.location as Record<string, unknown>)?.nombre_institucion as string) ?? '',
          location_id: i.location_id as number,
        }))
      )
    }
  }

  // Query parts (piezas)
  if (shouldQueryParts) {
    let q = supabase
      .from('stock_parts')
      .select('id, marca, modelo, codigo_marbete, cantidad, location_id, part_type:part_types(nombre), location:locations(nombre_institucion)')
      .limit(50)

    if (search) q = q.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,codigo_marbete.ilike.%${search}%`)
    if (locationId) q = q.eq('location_id', parseInt(locationId))

    const { data } = await q
    if (data) {
      results.push(
        ...data.map((p: Record<string, unknown>) => ({
          id: p.id as number,
          item_type: 'part',
          marca: (p.marca as string) ?? ((p.part_type as Record<string, unknown>)?.nombre as string) ?? '',
          modelo: (p.modelo as string) ?? '',
          identifier: (p.codigo_marbete as string) ?? '',
          tipo_activo: '',
          valor: 0,
          location_name: ((p.location as Record<string, unknown>)?.nombre_institucion as string) ?? '',
          location_id: p.location_id as number,
        }))
      )
    }
  }

  return NextResponse.json(results)
}
