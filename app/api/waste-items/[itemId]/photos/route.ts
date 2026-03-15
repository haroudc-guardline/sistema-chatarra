import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

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

const BUCKET = 'waste-item-photos'
const MAX_PHOTOS_PER_ITEM = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  const { data: photos, error } = await supabase
    .from('waste_item_photos')
    .select('*')
    .eq('waste_item_id', itemId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add public URLs
  const photosWithUrls = (photos ?? []).map((photo) => {
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(photo.file_path)
    return { ...photo, public_url: urlData.publicUrl }
  })

  return NextResponse.json(photosWithUrls)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  try {
    // Verify item exists and get location_id
    const { data: item, error: itemError } = await supabase
      .from('waste_items')
      .select('id, location_id')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item de residuo no encontrado' }, { status: 404 })
    }

    // Check current photo count
    const { count } = await supabase
      .from('waste_item_photos')
      .select('id', { count: 'exact', head: true })
      .eq('waste_item_id', itemId)

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No se proporcionaron archivos' }, { status: 400 })
    }

    if ((count ?? 0) + files.length > MAX_PHOTOS_PER_ITEM) {
      return NextResponse.json(
        { error: `Máximo ${MAX_PHOTOS_PER_ITEM} fotos por item. Actualmente tiene ${count ?? 0}.` },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    const uploadedPhotos = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue // Skip invalid types
      }
      if (file.size > MAX_FILE_SIZE) {
        continue // Skip oversized files
      }

      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${item.location_id}/${itemId}/${crypto.randomUUID()}.${ext}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        continue
      }

      // Insert metadata
      const { data: photoRecord, error: insertError } = await supabase
        .from('waste_item_photos')
        .insert({
          waste_item_id: parseInt(itemId),
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user?.id || null,
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('Photo metadata insert error:', insertError)
        // Clean up uploaded file
        await supabase.storage.from(BUCKET).remove([filePath])
        continue
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath)

      uploadedPhotos.push({ ...photoRecord, public_url: urlData.publicUrl })
    }

    if (!uploadedPhotos.length) {
      return NextResponse.json(
        { error: 'No se pudo subir ninguna foto. Verifica el formato y tamaño (max 5MB, jpeg/png/webp).' },
        { status: 400 }
      )
    }

    return NextResponse.json(uploadedPhotos, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  try {
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json({ error: 'ID de la foto requerido' }, { status: 400 })
    }

    // Get photo to find file_path
    const { data: photo, error: fetchError } = await supabase
      .from('waste_item_photos')
      .select('*')
      .eq('id', photoId)
      .eq('waste_item_id', itemId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })
    }

    // Delete from storage
    await supabase.storage.from(BUCKET).remove([photo.file_path])

    // Delete metadata
    const { error: deleteError } = await supabase
      .from('waste_item_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
