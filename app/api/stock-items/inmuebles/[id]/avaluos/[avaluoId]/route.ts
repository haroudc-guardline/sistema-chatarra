import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const BUCKET = 'inmueble-documents'

function createSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

async function requireOperador(supabase: ReturnType<typeof createSupabaseClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!profile || !['admin', 'operador'].includes(profile.rol)) {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) }
  }
  return { user }
}

// PATCH: editar campos o marcar como vigente (es_actual=true). El trigger desmarca los demás.
export async function PATCH(request: Request, { params }: { params: Promise<{ avaluoId: string }> }) {
  const { avaluoId } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const auth = await requireOperador(supabase)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const allowed: Record<string, unknown> = {}
    for (const k of ['monto', 'fecha_avaluo', 'entidad_avaluadora', 'notas', 'es_actual']) {
      if (k in body) allowed[k] = body[k]
    }
    const { data, error } = await supabase
      .from('inmueble_avaluos')
      .update(allowed)
      .eq('id', parseInt(avaluoId))
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ avaluoId: string }> }) {
  const { avaluoId } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const auth = await requireOperador(supabase)
  if (auth.error) return auth.error

  const { data: avaluo } = await supabase
    .from('inmueble_avaluos')
    .select('documento_path')
    .eq('id', parseInt(avaluoId))
    .single()

  if (avaluo?.documento_path) {
    await supabase.storage.from(BUCKET).remove([avaluo.documento_path])
  }

  const { error } = await supabase.from('inmueble_avaluos').delete().eq('id', parseInt(avaluoId))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
