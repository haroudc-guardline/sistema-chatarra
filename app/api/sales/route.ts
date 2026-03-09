import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { salesService } from '@/lib/services/sales-service'

function createSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabase(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const locationId = searchParams.get('locationId')
      ? parseInt(searchParams.get('locationId')!)
      : undefined

    const data = await salesService.getListings({ status, locationId })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching sales listings:', error)
    return NextResponse.json({ error: 'Error al obtener listados' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabase(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { listing, items } = body

    if (!listing || !listing.location_id || !listing.title) {
      return NextResponse.json(
        { error: 'location_id y title son requeridos' },
        { status: 400 }
      )
    }

    const created = await salesService.createListing(listing, items ?? [])
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating sales listing:', error)
    return NextResponse.json({ error: 'Error al crear listado' }, { status: 500 })
  }
}
