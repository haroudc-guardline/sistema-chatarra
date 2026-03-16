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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { data, error } = await supabase
    .from('waste_subcategories')
    .select('id, nombre, waste_type_id, created_at')
    .eq('waste_type_id', id)
    .order('nombre')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  try {
    const body = await request.json()
    const nombre = body.nombre?.trim()

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('waste_subcategories')
      .select('id')
      .eq('waste_type_id', id)
      .ilike('nombre', nombre)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Esta subcategoría ya existe para este tipo' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('waste_subcategories')
      .insert({ waste_type_id: parseInt(id), nombre })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
