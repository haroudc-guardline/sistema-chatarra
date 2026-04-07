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

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)
  const { searchParams } = new URL(request.url)

  const inmuebleTypeId = searchParams.get('inmueble_type_id')
  const activoTypeId = searchParams.get('activo_type_id')
  const avaluo = searchParams.get('avaluo')
  const registro = searchParams.get('registro')
  const search = searchParams.get('search')
  const ciudad = searchParams.get('ciudad')
  const municipio = searchParams.get('municipio')
  const nombreInstitucion = searchParams.get('nombre_institucion')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = (page - 1) * limit

  let query = supabase
    .from('stock_inmuebles')
    .select(
      '*, inmueble_type:inmueble_types(id, nombre), activo_type:inmueble_activo_types(id, nombre), location:locations(id, nombre_institucion, ciudad, municipio)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (inmuebleTypeId) query = query.eq('inmueble_type_id', parseInt(inmuebleTypeId))
  if (activoTypeId) query = query.eq('activo_type_id', parseInt(activoTypeId))
  if (avaluo) query = query.eq('avaluo', avaluo)
  if (registro) query = query.eq('registro', registro)
  if (search) query = query.ilike('nombre', `%${search}%`)

  if (municipio || nombreInstitucion || ciudad) {
    let locQuery = supabase.from('locations').select('id')
    if (municipio) locQuery = locQuery.eq('municipio', municipio)
    if (ciudad) locQuery = locQuery.ilike('ciudad', `%${ciudad}%`)
    if (nombreInstitucion) locQuery = locQuery.ilike('nombre_institucion', `%${nombreInstitucion}%`)
    const { data: locs } = await locQuery
    if (locs?.length) {
      query = query.in('location_id', locs.map((l) => l.id))
    } else {
      return NextResponse.json({ data: [], count: 0 })
    }
  }

  query = query.range(offset, offset + limit - 1)
  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching inmuebles:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
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
    if (!body.nombre) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    if (!body.inmueble_type_id) return NextResponse.json({ error: 'El tipo de inmueble es requerido' }, { status: 400 })
    if (!body.location_id) return NextResponse.json({ error: 'La institucion es requerida' }, { status: 400 })

    const { data: inserted, error: insertError } = await supabase
      .from('stock_inmuebles')
      .insert({ ...body, created_by: user.id })
      .select(
        '*, inmueble_type:inmueble_types(id, nombre), activo_type:inmueble_activo_types(id, nombre), location:locations(id, nombre_institucion, ciudad, municipio)'
      )
      .single()

    if (insertError) {
      console.error('Error creating inmueble:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
