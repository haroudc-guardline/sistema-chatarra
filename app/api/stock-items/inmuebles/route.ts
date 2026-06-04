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
  const aniosAvaluo = searchParams.get('anios_avaluo')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = (page - 1) * limit

  // Filtro multi-selección de incidencias pendientes (CSV)
  const pendienteRaw = searchParams.get('pendiente')
  const pendientes = pendienteRaw ? pendienteRaw.split(',').map((s) => s.trim()).filter(Boolean) : null

  // El RPC search_inmuebles encapsula filtros + completitud + paginación + count
  const { data, error } = await supabase.rpc('search_inmuebles', {
    p_inmueble_type_id: inmuebleTypeId ? parseInt(inmuebleTypeId) : null,
    p_activo_type_id: activoTypeId ? parseInt(activoTypeId) : null,
    p_avaluo: searchParams.get('avaluo') || null,
    p_registro: searchParams.get('registro') || null,
    p_planos: searchParams.get('planos_actualizados') || null,
    p_search: searchParams.get('search') || null,
    p_ciudad: searchParams.get('ciudad') || null,
    p_municipio: searchParams.get('municipio') || null,
    p_nombre_institucion: searchParams.get('nombre_institucion') || null,
    p_pendientes: pendientes,
    p_anios_avaluo: aniosAvaluo ? parseInt(aniosAvaluo) : 3,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error('Error fetching inmuebles:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // El RPC devuelve { data, count }
  return NextResponse.json({ data: data?.data ?? [], count: data?.count ?? 0 })
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
