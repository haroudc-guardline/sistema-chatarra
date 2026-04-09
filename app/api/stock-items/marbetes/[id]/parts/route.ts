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

// POST: Add parts to an existing marbete
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!profile || !['admin', 'operador'].includes(profile.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Get the marbete
  const { data: marbete, error: marbeteError } = await supabase
    .from('marbetes')
    .select('*')
    .eq('id', parseInt(id))
    .single()

  if (marbeteError || !marbete) {
    return NextResponse.json({ error: 'Marbete no encontrado' }, { status: 404 })
  }

  const table = CATEGORY_TABLE[marbete.category]
  if (!table) return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })

  try {
    const body = await request.json()
    const { parts } = body

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({ error: 'Debe incluir al menos una pieza' }, { status: 400 })
    }

    const partsToInsert = parts.map((p: Record<string, unknown>) => ({
      ...p,
      location_id: marbete.location_id,
      marbete_id: marbete.id,
      codigo_marbete: marbete.codigo,
      responsable_nombre: marbete.responsable_nombre,
      responsable_telefono: marbete.responsable_telefono,
      responsable_email: marbete.responsable_email,
      ubicacion_nombre: marbete.ubicacion_nombre,
      ubicacion_direccion: marbete.ubicacion_direccion,
      ubicacion_municipio: marbete.ubicacion_municipio,
      created_by: user.id,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from(table)
      .insert(partsToInsert)
      .select('*, part_type:part_types(id, category, nombre, created_by_user, created_at)')

    if (insertError) {
      console.error('Error adding parts to marbete:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ parts: inserted ?? [] }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
