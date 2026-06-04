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
  const { searchParams } = new URL(request.url)
  const documentTypeId = searchParams.get('document_type_id')

  let query = supabase
    .from('inmueble_documents')
    .select('*, document_type:inmueble_document_types(id, nombre, is_required, orden)')
    .eq('inmueble_id', parseInt(id))
    .order('created_at', { ascending: false })

  if (documentTypeId) query = query.eq('document_type_id', parseInt(documentTypeId))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withUrls = (data ?? []).map((d) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(d.file_path)
    return { ...d, public_url: urlData.publicUrl }
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
    const documentTypeId = parseInt(formData.get('document_type_id') as string)
    const files = formData.getAll('files') as File[]

    if (!documentTypeId) return NextResponse.json({ error: 'El tipo de documento es requerido' }, { status: 400 })
    if (!files.length) return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 })

    const uploaded = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: `${file.name} excede 25MB` }, { status: 400 })
      if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: `Tipo no permitido: ${file.type}` }, { status: 400 })

      const ext = file.name.split('.').pop()
      const filePath = `${inmuebleId}/${documentTypeId}/${randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filePath, await file.arrayBuffer(), { contentType: file.type })
      if (upErr) return NextResponse.json({ error: `Error al subir ${file.name}` }, { status: 500 })

      const { data: rec, error: dbErr } = await supabase
        .from('inmueble_documents')
        .insert({
          inmueble_id: inmuebleId,
          document_type_id: documentTypeId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: auth.user!.id,
        })
        .select('*, document_type:inmueble_document_types(id, nombre, is_required, orden)')
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
    console.error('Error uploading documents:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const auth = await requireOperador(supabase)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('documentId')
  if (!documentId) return NextResponse.json({ error: 'documentId requerido' }, { status: 400 })

  const { data: doc } = await supabase.from('inmueble_documents').select('file_path').eq('id', documentId).single()
  if (doc) await supabase.storage.from(BUCKET).remove([doc.file_path])

  const { error } = await supabase.from('inmueble_documents').delete().eq('id', documentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
