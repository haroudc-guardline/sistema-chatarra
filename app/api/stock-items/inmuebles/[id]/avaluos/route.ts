import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const BUCKET = 'inmueble-documents'
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { data, error } = await supabase
    .from('inmueble_avaluos')
    .select('*')
    .eq('inmueble_id', parseInt(id))
    .order('fecha_avaluo', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = (data ?? []).map((a) => {
    if (!a.documento_path) return a
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(a.documento_path)
    return { ...a, public_url: urlData.publicUrl }
  })
  return NextResponse.json(withUrls)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const inmuebleId = parseInt(id)
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const auth = await requireOperador(supabase)
  if (auth.error) return auth.error

  try {
    const formData = await request.formData()
    const monto = parseFloat(formData.get('monto') as string)
    const fechaAvaluo = formData.get('fecha_avaluo') as string
    const entidad = (formData.get('entidad_avaluadora') as string) || null
    const notas = (formData.get('notas') as string) || null
    const esActualRaw = formData.get('es_actual') as string | null
    const file = formData.get('documento') as File | null

    if (isNaN(monto) || monto < 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    if (!fechaAvaluo) return NextResponse.json({ error: 'La fecha del avalúo es requerida' }, { status: 400 })

    // Primer avalúo del inmueble => vigente por defecto
    const { count } = await supabase
      .from('inmueble_avaluos')
      .select('*', { count: 'exact', head: true })
      .eq('inmueble_id', inmuebleId)
    const esActual = esActualRaw != null ? esActualRaw === 'true' : (count ?? 0) === 0

    let documentoPath: string | null = null
    let documentoNombre: string | null = null
    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: `${file.name} excede 25MB` }, { status: 400 })
      if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: `Tipo no permitido: ${file.type}` }, { status: 400 })
      const ext = file.name.split('.').pop()
      documentoPath = `avaluos/${inmuebleId}/${randomUUID()}.${ext}`
      documentoNombre = file.name
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(documentoPath, await file.arrayBuffer(), { contentType: file.type })
      if (upErr) return NextResponse.json({ error: `Error al subir documento: ${upErr.message}` }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('inmueble_avaluos')
      .insert({
        inmueble_id: inmuebleId,
        monto,
        fecha_avaluo: fechaAvaluo,
        entidad_avaluadora: entidad,
        notas,
        es_actual: esActual,
        documento_path: documentoPath,
        documento_nombre: documentoNombre,
        created_by: auth.user!.id,
      })
      .select()
      .single()

    if (error) {
      if (documentoPath) await supabase.storage.from(BUCKET).remove([documentoPath])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error creating avaluo:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
