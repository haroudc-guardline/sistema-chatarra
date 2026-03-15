import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const VALID_QUALITY_OPTIONS = ['Excelente', 'Buena', 'Regular', 'Baja', 'Deficiente']

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

  // Use Supabase alias syntax: waste_type:waste_types(*) to get the join as singular name
  const { data: wasteItems, error } = await supabase
    .from('waste_items')
    .select('id, location_id, waste_type_id, subcategoria, volume, weight, value, quality, created_at, waste_type:waste_types(*)')
    .eq('location_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching waste items:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(wasteItems ?? [])
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

    if (!body.waste_type_id) {
      return NextResponse.json({ error: 'El tipo de residuo es requerido' }, { status: 400 })
    }
    if (!body.volume || body.volume <= 0) {
      return NextResponse.json({ error: 'El volumen debe ser mayor a 0' }, { status: 400 })
    }
    if (!body.weight || body.weight <= 0) {
      return NextResponse.json({ error: 'El peso debe ser mayor a 0' }, { status: 400 })
    }
    if (body.value === undefined || body.value === null || body.value < 0) {
      return NextResponse.json({ error: 'El valor no puede ser negativo' }, { status: 400 })
    }
    if (body.quality && !VALID_QUALITY_OPTIONS.includes(body.quality)) {
      return NextResponse.json(
        { error: `Calidad inválida. Opciones: ${VALID_QUALITY_OPTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const insertData = {
      location_id: parseInt(id),
      waste_type_id: Number(body.waste_type_id),
      subcategoria: body.subcategoria || null,
      volume: Number(body.volume),
      weight: Number(body.weight),
      value: Number(body.value),
      quality: body.quality || null,
    }

    // Step 1: Insert
    const { data: inserted, error: insertError } = await supabase
      .from('waste_items')
      .insert(insertData)
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating waste item:', insertError)
      return NextResponse.json({ error: `Error al crear el item: ${insertError.message}` }, { status: 500 })
    }

    // Step 2: Fetch with join using alias syntax
    const { data: newItem, error: fetchError } = await supabase
      .from('waste_items')
      .select('id, location_id, waste_type_id, subcategoria, volume, weight, value, quality, created_at, waste_type:waste_types(*)')
      .eq('id', inserted.id)
      .single()

    if (fetchError) {
      console.error('Error fetching created item:', fetchError)
      return NextResponse.json({ error: 'Item creado pero error al obtenerlo' }, { status: 500 })
    }

    return NextResponse.json(newItem, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'ID del item requerido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('waste_items')
      .delete()
      .eq('id', itemId)
      .eq('location_id', id)

    if (error) {
      console.error('Error deleting waste item:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
