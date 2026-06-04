import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const BUCKET = 'inmueble-media'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const CATEGORIAS = ['Fachada', 'Interiores', 'Áreas comunes', 'Pasillos', 'Elevadores', 'Vista aérea', 'Otra']

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
  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')
  const mediaType = searchParams.get('media_type')

  let query = supabase
    .from('inmueble_media')
    .select('*')
    .eq('inmueble_id', parseInt(id))
    .order('created_at', { ascending: false })

  if (categoria) query = query.eq('categoria', categoria)
  if (mediaType) query = query.eq('media_type', mediaType)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = (data ?? []).map((m) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(m.file_path)
    return { ...m, public_url: urlData.publicUrl }
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
    const categoria = (formData.get('categoria') as string) || 'Otra'
    const files = formData.getAll('files') as File[]

    if (!CATEGORIAS.includes(categoria)) return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    if (!files.length) return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 })

    const uploaded = []
    for (const file of files) {
      const isImage = IMAGE_TYPES.includes(file.type)
      const isVideo = VIDEO_TYPES.includes(file.type)
      if (!isImage && !isVideo) return NextResponse.json({ error: `Tipo no permitido: ${file.type}` }, { status: 400 })
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
      if (file.size > maxSize) {
        return NextResponse.json({ error: `${file.name} excede ${isVideo ? '200MB' : '5MB'}` }, { status: 400 })
      }

      const mediaType = isVideo ? 'video' : 'image'
      const ext = file.name.split('.').pop()
      const filePath = `${inmuebleId}/${categoria}/${randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filePath, await file.arrayBuffer(), { contentType: file.type })
      if (upErr) return NextResponse.json({ error: `Error al subir ${file.name}` }, { status: 500 })

      const { data: rec, error: dbErr } = await supabase
        .from('inmueble_media')
        .insert({
          inmueble_id: inmuebleId,
          media_type: mediaType,
          categoria,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: auth.user!.id,
        })
        .select()
        .single()

      if (dbErr) {
        await supabase.storage.from(BUCKET).remove([filePath])
        return NextResponse.json({ error: dbErr.message }, { status: 500 })
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
      uploaded.push({ ...rec, public_url: urlData.publicUrl })
    }
    return NextResponse.json(uploaded, { status: 201 })
  } catch (err) {
    console.error('Error uploading media:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const auth = await requireOperador(supabase)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get('mediaId')
  if (!mediaId) return NextResponse.json({ error: 'mediaId requerido' }, { status: 400 })

  const { data: m } = await supabase.from('inmueble_media').select('file_path').eq('id', mediaId).single()
  if (m) await supabase.storage.from(BUCKET).remove([m.file_path])

  const { error } = await supabase.from('inmueble_media').delete().eq('id', mediaId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
