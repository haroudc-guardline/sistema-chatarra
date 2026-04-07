import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_PHOTOS = 10
const BUCKET = 'stock-item-photos'

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

  const itemType = searchParams.get('item_type')
  const itemId = searchParams.get('item_id')

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'item_type y item_id son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('stock_item_photos')
    .select('*')
    .eq('item_type', itemType)
    .eq('item_id', parseInt(itemId))
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const photosWithUrls = (data ?? []).map((photo) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(photo.file_path)
    return { ...photo, public_url: urlData.publicUrl }
  })

  return NextResponse.json(photosWithUrls)
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
    const formData = await request.formData()
    const itemType = formData.get('item_type') as string
    const itemId = parseInt(formData.get('item_id') as string)
    const files = formData.getAll('files') as File[]

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'item_type y item_id son requeridos' }, { status: 400 })
    }
    if (!['vehicle', 'ac_unit', 'tool', 'inmueble'].includes(itemType)) {
      return NextResponse.json({ error: 'item_type inválido' }, { status: 400 })
    }

    // Check existing photo count
    const { count } = await supabase
      .from('stock_item_photos')
      .select('*', { count: 'exact', head: true })
      .eq('item_type', itemType)
      .eq('item_id', itemId)

    if ((count ?? 0) + files.length > MAX_PHOTOS) {
      return NextResponse.json({ error: `Máximo ${MAX_PHOTOS} fotos permitidas` }, { status: 400 })
    }

    const uploaded = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `${file.name} excede el límite de 5MB` }, { status: 400 })
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Tipo de archivo no permitido: ${file.type}` }, { status: 400 })
      }

      const ext = file.name.split('.').pop()
      const filePath = `${itemType}/${itemId}/${randomUUID()}.${ext}`
      const arrayBuffer = await file.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, arrayBuffer, { contentType: file.type })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return NextResponse.json({ error: `Error al subir ${file.name}` }, { status: 500 })
      }

      const { data: photoRecord, error: dbError } = await supabase
        .from('stock_item_photos')
        .insert({
          item_type: itemType,
          item_id: itemId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (dbError) {
        await supabase.storage.from(BUCKET).remove([filePath])
        return NextResponse.json({ error: dbError.message }, { status: 500 })
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
      uploaded.push({ ...photoRecord, public_url: urlData.publicUrl })
    }

    return NextResponse.json(uploaded, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!profile || !['admin', 'operador'].includes(profile.rol)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const photoId = searchParams.get('photoId')
  if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 })

  const { data: photo } = await supabase
    .from('stock_item_photos')
    .select('file_path')
    .eq('id', photoId)
    .single()

  if (photo) {
    await supabase.storage.from(BUCKET).remove([photo.file_path])
  }

  const { error } = await supabase.from('stock_item_photos').delete().eq('id', photoId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
