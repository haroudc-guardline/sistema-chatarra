import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cache geography data for 24 hours at the CDN edge
export const revalidate = 86400

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * GET /api/geography
 * Returns provinces or districts from panama_geography.
 *
 * Query params:
 *   ?type=provincias           → returns list of all province names
 *   ?type=distritos&provincia= → returns districts for a given province
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'provincias'
  const provincia = searchParams.get('provincia')

  const supabase = createSupabase()

  if (type === 'distritos' && provincia) {
    const { data, error } = await supabase
      .from('panama_geography')
      .select('distrito')
      .eq('provincia', provincia)
      .order('distrito')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { distritos: data?.map((d) => d.distrito) ?? [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      }
    )
  }

  // Default: return all provinces
  const { data, error } = await supabase
    .from('panama_geography')
    .select('provincia')
    .order('provincia')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const provincias = [...new Set(data?.map((d) => d.provincia) ?? [])]

  return NextResponse.json(
    { provincias },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    }
  )
}
