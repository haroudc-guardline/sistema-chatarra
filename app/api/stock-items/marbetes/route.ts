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

const CATEGORY_TABLE: Record<string, string> = {
  vehicle: 'vehicle_parts',
  ac_unit: 'ac_unit_parts',
  tool: 'tool_parts',
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const locationId = searchParams.get('location_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = (page - 1) * limit

  let query = supabase
    .from('marbetes')
    .select('*, location:locations(id, nombre_institucion, ciudad, municipio)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (locationId) query = query.eq('location_id', parseInt(locationId))
  if (search) query = query.ilike('codigo', `%${search}%`)

  query = query.range(offset, offset + limit - 1)
  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching marbetes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get parts count for each marbete
  if (data && data.length > 0 && category) {
    const table = CATEGORY_TABLE[category]
    if (table) {
      const marbeteIds = data.map((m) => m.id)
      const { data: parts } = await supabase
        .from(table)
        .select('marbete_id')
        .in('marbete_id', marbeteIds)

      const countMap: Record<number, number> = {}
      parts?.forEach((p) => {
        if (p.marbete_id) {
          countMap[p.marbete_id] = (countMap[p.marbete_id] || 0) + 1
        }
      })
      data.forEach((m) => {
        (m as Record<string, unknown>).parts_count = countMap[m.id] || 0
      })
    }
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
    const { parts, ...marbeteData } = body

    if (!marbeteData.codigo) return NextResponse.json({ error: 'El código de marbete es requerido' }, { status: 400 })
    if (!marbeteData.category) return NextResponse.json({ error: 'La categoría es requerida' }, { status: 400 })
    if (!marbeteData.location_id) return NextResponse.json({ error: 'La institución es requerida' }, { status: 400 })

    // Create the marbete
    const { data: marbete, error: marbeteError } = await supabase
      .from('marbetes')
      .insert({ ...marbeteData, created_by: user.id })
      .select('*, location:locations(id, nombre_institucion, ciudad, municipio)')
      .single()

    if (marbeteError) {
      if (marbeteError.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un marbete con este código para esta categoría' }, { status: 409 })
      }
      console.error('Error creating marbete:', marbeteError)
      return NextResponse.json({ error: marbeteError.message }, { status: 500 })
    }

    // If parts were provided, create them
    let createdParts: unknown[] = []
    if (parts && Array.isArray(parts) && parts.length > 0) {
      const table = CATEGORY_TABLE[marbeteData.category]
      if (!table) return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })

      const partsToInsert = parts.map((p: Record<string, unknown>) => ({
        ...p,
        location_id: marbeteData.location_id,
        marbete_id: marbete.id,
        codigo_marbete: marbeteData.codigo,
        marca: marbeteData.marca || p.marca,
        modelo: marbeteData.modelo || p.modelo,
        responsable_nombre: marbeteData.responsable_nombre,
        responsable_telefono: marbeteData.responsable_telefono,
        responsable_email: marbeteData.responsable_email,
        ubicacion_nombre: marbeteData.ubicacion_nombre,
        ubicacion_direccion: marbeteData.ubicacion_direccion,
        ubicacion_municipio: marbeteData.ubicacion_municipio,
        created_by: user.id,
      }))

      const { data: insertedParts, error: partsError } = await supabase
        .from(table)
        .insert(partsToInsert)
        .select('*, part_type:part_types(id, category, nombre, created_by_user, created_at)')

      if (partsError) {
        console.error('Error creating parts:', partsError)
        // Rollback marbete
        await supabase.from('marbetes').delete().eq('id', marbete.id)
        return NextResponse.json({ error: partsError.message }, { status: 500 })
      }
      createdParts = insertedParts ?? []
    }

    return NextResponse.json({ ...marbete, parts: createdParts, parts_count: createdParts.length }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
