import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function createSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { searchParams } = new URL(request.url)
  const wasteTypeId = searchParams.get('waste_type_id')
  const subcategoria = searchParams.get('subcategoria')
  const quality = searchParams.get('quality')
  const locationId = searchParams.get('location_id')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = (page - 1) * limit

  let query = supabase
    .from('waste_items')
    .select(
      'id, location_id, waste_type_id, subcategoria, volume, weight, value, quality, created_at, waste_type:waste_types(*), location:locations(id, nombre_institucion, ciudad, municipio, direccion)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (wasteTypeId) {
    query = query.eq('waste_type_id', parseInt(wasteTypeId))
  }
  if (subcategoria) {
    query = query.ilike('subcategoria', `%${subcategoria}%`)
  }
  if (quality) {
    query = query.eq('quality', quality)
  }
  if (locationId) {
    query = query.eq('location_id', parseInt(locationId))
  }
  if (search) {
    query = query.ilike('subcategoria', `%${search}%`)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching waste items:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}
