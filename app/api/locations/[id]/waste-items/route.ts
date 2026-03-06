import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Valid quality options
const VALID_QUALITY_OPTIONS = ['Excelente', 'Buena', 'Regular', 'Baja', 'Deficiente']

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  const { data: wasteItems, error } = await supabase
    .from('waste_items')
    .select('*, waste_types(*)')
    .eq('location_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching waste items:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(wasteItems)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  try {
    const body = await request.json()

    // Validation
    if (!body.waste_type_id) {
      return NextResponse.json(
        { error: 'El tipo de residuo es requerido' },
        { status: 400 }
      )
    }

    if (!body.volume || body.volume <= 0) {
      return NextResponse.json(
        { error: 'El volumen debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (!body.weight || body.weight <= 0) {
      return NextResponse.json(
        { error: 'El peso debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (body.value === undefined || body.value === null || body.value < 0) {
      return NextResponse.json(
        { error: 'El valor no puede ser negativo' },
        { status: 400 }
      )
    }

    // Validate quality if provided
    if (body.quality && !VALID_QUALITY_OPTIONS.includes(body.quality)) {
      return NextResponse.json(
        { error: `Calidad inválida. Opciones válidas: ${VALID_QUALITY_OPTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert with location_id from URL params
    const insertData = {
      location_id: parseInt(id),
      waste_type_id: body.waste_type_id,
      volume: body.volume,
      weight: body.weight,
      value: body.value,
      quality: body.quality || null,
    }

    const { data: newWasteItem, error } = await supabase
      .from('waste_items')
      .insert(insertData)
      .select('*, waste_types(*)')
      .single()

    if (error) {
      console.error('Error creating waste item:', error)
      return NextResponse.json(
        { error: `Error al crear el item: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(newWasteItem, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'ID del item requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('waste_items')
      .delete()
      .eq('id', itemId)
      .eq('location_id', id)

    if (error) {
      console.error('Error deleting waste item:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
