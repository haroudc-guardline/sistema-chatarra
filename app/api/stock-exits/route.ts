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

async function fetchItemDetail(
  supabase: ReturnType<typeof createServerClient>,
  itemType: string,
  itemId: number
) {
  if (itemType === 'vehicle') {
    const { data } = await supabase.from('stock_vehicles').select('marca, modelo, placa, tipo_activo').eq('id', itemId).single()
    if (!data) return null
    return { marca: data.marca ?? '', modelo: data.modelo ?? '', placa: data.placa, tipo_activo: data.tipo_activo }
  }
  if (itemType === 'ac_unit') {
    const { data } = await supabase.from('stock_ac_units').select('marca, modelo, numero_serie, tipo_activo').eq('id', itemId).single()
    if (!data) return null
    return { marca: data.marca ?? '', modelo: data.modelo ?? '', numero_serie: data.numero_serie, tipo_activo: data.tipo_activo }
  }
  if (itemType === 'tool') {
    const { data } = await supabase.from('stock_tools').select('nombre, marca, modelo, numero_serie, tipo_activo').eq('id', itemId).single()
    if (!data) return null
    return { marca: data.marca ?? data.nombre ?? '', modelo: data.modelo ?? '', numero_serie: data.numero_serie, tipo_activo: data.tipo_activo }
  }
  if (itemType === 'inmueble') {
    const { data } = await supabase.from('stock_inmuebles').select('nombre, inmueble_type:inmueble_types(nombre)').eq('id', itemId).single()
    if (!data) return null
    return { marca: data.nombre ?? '', modelo: (data.inmueble_type as any)?.nombre ?? '' }
  }
  if (itemType === 'part') {
    const { data } = await supabase.from('stock_parts').select('marca, modelo, codigo_marbete, part_type:part_types(nombre)').eq('id', itemId).single()
    if (!data) return null
    return { marca: data.marca ?? (data.part_type as any)?.nombre ?? '', modelo: data.modelo ?? '', numero_serie: data.codigo_marbete }
  }
  return null
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)
  const { searchParams } = new URL(request.url)

  const itemType = searchParams.get('item_type')
  const tipoSalida = searchParams.get('tipo_salida')
  const nombreInstitucion = searchParams.get('nombre_institucion')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = (page - 1) * limit

  let query = supabase
    .from('stock_exits')
    .select('*, location:locations(id, nombre_institucion, ciudad, municipio)', { count: 'exact' })
    .order('fecha_salida', { ascending: false })

  if (itemType) query = query.eq('item_type', itemType)
  if (tipoSalida) query = query.eq('tipo_salida', tipoSalida)

  if (nombreInstitucion) {
    const { data: locs } = await supabase
      .from('locations')
      .select('id')
      .ilike('nombre_institucion', `%${nombreInstitucion}%`)
    if (locs?.length) {
      query = query.in('location_id', locs.map((l) => l.id))
    } else {
      return NextResponse.json({ data: [], count: 0 })
    }
  }

  if (search) {
    query = query.or(
      `descripcion.ilike.%${search}%,responsable_nombre.ilike.%${search}%`
    )
  }

  query = query.range(offset, offset + limit - 1)
  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching stock exits:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch item details for each exit
  const exits = data ?? []
  const exitsWithDetails = await Promise.all(
    exits.map(async (exit) => {
      const item_detail = await fetchItemDetail(supabase, exit.item_type, exit.item_id)
      return { ...exit, item_detail }
    })
  )

  return NextResponse.json({ data: exitsWithDetails, count: count ?? 0 })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!profile || !['admin', 'operador'].includes(profile.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const body = await request.json()

    if (!body.item_type) return NextResponse.json({ error: 'El tipo de item es requerido' }, { status: 400 })
    if (!body.item_id) return NextResponse.json({ error: 'El item es requerido' }, { status: 400 })
    if (!body.location_id) return NextResponse.json({ error: 'La ubicación es requerida' }, { status: 400 })
    if (!body.tipo_salida) return NextResponse.json({ error: 'El tipo de salida es requerido' }, { status: 400 })

    const { data: inserted, error: insertError } = await supabase
      .from('stock_exits')
      .insert({ ...body, created_by: user.id })
      .select('*, location:locations(id, nombre_institucion, ciudad, municipio)')
      .single()

    if (insertError) {
      console.error('Error creating stock exit:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
