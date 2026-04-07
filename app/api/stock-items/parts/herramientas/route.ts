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
  const partTypeId = searchParams.get('part_type_id')
  const estado = searchParams.get('estado')
  const search = searchParams.get('search')
  const municipio = searchParams.get('municipio')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = (page - 1) * limit

  let query = supabase
    .from('tool_parts')
    .select('*, part_type:part_types(id, category, nombre, created_by_user, created_at), location:locations(id, nombre_institucion, ciudad, municipio)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (locationId) query = query.eq('location_id', parseInt(locationId))
  if (partTypeId) query = query.eq('part_type_id', parseInt(partTypeId))
  if (estado) query = query.eq('estado', estado)
  if (search) query = query.or(`marca.ilike.%${search}%,modelo.ilike.%${search}%`)
  if (municipio) {
    const { data: locs } = await supabase.from('locations').select('id').eq('municipio', municipio)
    if (locs?.length) {
      query = query.in('location_id', locs.map((l) => l.id))
    } else {
      return NextResponse.json({ data: [], count: 0 })
    }
  }

  query = query.range(offset, offset + limit - 1)
  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching tool parts:', error)
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
    if (!body.part_type_id) return NextResponse.json({ error: 'El tipo de pieza es requerido' }, { status: 400 })
    if (!body.location_id) return NextResponse.json({ error: 'La institución es requerida' }, { status: 400 })

    const { data: inserted, error: insertError } = await supabase
      .from('tool_parts')
      .insert({ ...body, created_by: user.id })
      .select('*, part_type:part_types(id, category, nombre, created_by_user, created_at), location:locations(id, nombre_institucion, ciudad, municipio)')
      .single()

    if (insertError) {
      console.error('Error creating tool part:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
