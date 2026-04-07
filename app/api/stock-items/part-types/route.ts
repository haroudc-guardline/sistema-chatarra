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

  const category = searchParams.get('category')
  if (!category) {
    return NextResponse.json({ error: 'El parámetro category es requerido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('part_types')
    .select('*')
    .eq('category', category)
    .order('created_by_user', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error fetching part types:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
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
    if (!body.category) return NextResponse.json({ error: 'La categoría es requerida' }, { status: 400 })
    if (!body.nombre) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

    const { data: inserted, error: insertError } = await supabase
      .from('part_types')
      .insert({
        category: body.category,
        nombre: body.nombre,
        created_by_user: true,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating part type:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
