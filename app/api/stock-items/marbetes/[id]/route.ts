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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { data: marbete, error } = await supabase
    .from('marbetes')
    .select('*, location:locations(id, nombre_institucion, ciudad, municipio)')
    .eq('id', parseInt(id))
    .single()

  if (error || !marbete) {
    return NextResponse.json({ error: 'Marbete no encontrado' }, { status: 404 })
  }

  // Fetch associated parts
  const table = CATEGORY_TABLE[marbete.category]
  if (table) {
    const { data: parts } = await supabase
      .from(table)
      .select('*, part_type:part_types(id, category, nombre, created_by_user, created_at)')
      .eq('marbete_id', marbete.id)
      .order('created_at', { ascending: false })

    ;(marbete as Record<string, unknown>).parts = parts ?? []
    ;(marbete as Record<string, unknown>).parts_count = parts?.length ?? 0
  }

  return NextResponse.json(marbete)
}

export async function PATCH(
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

  try {
    const body = await request.json()
    const { data: updated, error } = await supabase
      .from('marbetes')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', parseInt(id))
      .select('*, location:locations(id, nombre_institucion, ciudad, municipio)')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un marbete con este código para esta categoría' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
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

  const { error } = await supabase
    .from('marbetes')
    .delete()
    .eq('id', parseInt(id))

  if (error) {
    console.error('Error deleting marbete:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
