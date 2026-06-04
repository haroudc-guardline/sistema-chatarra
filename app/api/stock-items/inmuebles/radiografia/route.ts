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

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)
  const { searchParams } = new URL(request.url)

  const inmuebleTypeId = searchParams.get('inmueble_type_id')
  const aniosAvaluo = searchParams.get('anios_avaluo')

  const { data, error } = await supabase.rpc('inmuebles_radiografia', {
    p_inmueble_type_id: inmuebleTypeId ? parseInt(inmuebleTypeId) : null,
    p_ciudad: searchParams.get('ciudad') || null,
    p_municipio: searchParams.get('municipio') || null,
    p_nombre_institucion: searchParams.get('nombre_institucion') || null,
    p_anios_avaluo: aniosAvaluo ? parseInt(aniosAvaluo) : 3,
  })

  if (error) {
    console.error('Error en radiografia:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
