
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST handler to create a new waste type
export async function POST(request: Request) {
  const cookieStore = cookies()
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
    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Check if it already exists (case-insensitive)
    const { data: existing, error: fetchError } = await supabase
      .from('waste_types')
      .select('id')
      .ilike('nombre', name.trim())
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'not found' error
      throw fetchError
    }
    
    if (existing) {
      return NextResponse.json({ error: 'Este tipo de residuo ya existe' }, { status: 409 })
    }

    // Create new waste type
    const { data: newWasteType, error: insertError } = await supabase
      .from('waste_types')
      .insert({ nombre: name.trim(), categoria: 'General' }) // Default category
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json(newWasteType)

  } catch (error: any) {
    console.error('Error creating waste type:', error)
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 })
  }
}
