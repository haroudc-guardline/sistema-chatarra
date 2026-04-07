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

  const locationId = searchParams.get('location_id')
  const estado = searchParams.get('estado')
  const tipoAc = searchParams.get('tipo_ac')
  const tipoActivo = searchParams.get('tipo_activo')
  const nombreInstitucion = searchParams.get('nombre_institucion')
  const search = searchParams.get('search')
  const municipio = searchParams.get('municipio')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = (page - 1) * limit

  let query = supabase
    .from('stock_ac_units')
    .select('*, location:locations(id, nombre_institucion, ciudad, municipio)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (locationId) query = query.eq('location_id', parseInt(locationId))
  if (estado) query = query.eq('estado', estado)
  if (tipoAc) query = query.eq('tipo_ac', tipoAc)
  if (tipoActivo) query = query.eq('tipo_activo', tipoActivo)
  if (search) query = query.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%,numero_serie.ilike.%${search}%`)
  if (municipio || nombreInstitucion) {
    let locQuery = supabase.from('locations').select('id')
    if (municipio) locQuery = locQuery.eq('municipio', municipio)
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
    console.error('Error fetching AC units:', error)
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
    if (!body.location_id) return NextResponse.json({ error: 'La institución es requerida' }, { status: 400 })
    if (!body.marca) return NextResponse.json({ error: 'La marca es requerida' }, { status: 400 })
    if (!body.modelo) return NextResponse.json({ error: 'El modelo es requerido' }, { status: 400 })

    const { data: inserted, error: insertError } = await supabase
      .from('stock_ac_units')
      .insert({ ...body, created_by: user.id })
      .select('*, location:locations(id, nombre_institucion, ciudad, municipio)')
      .single()

    if (insertError) {
      console.error('Error creating AC unit:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
