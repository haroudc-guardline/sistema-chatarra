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

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createSupabaseClient(cookieStore)

  try {
    // Stock: vehicles
    const { count: vehiculosCount } = await supabase
      .from('stock_vehicles')
      .select('*', { count: 'exact', head: true })
    const { data: vehiculosSum } = await supabase
      .from('stock_vehicles')
      .select('valor')
    const vehiculosValor = (vehiculosSum ?? []).reduce(
      (acc, r) => acc + (r.valor ?? 0),
      0
    )

    // Stock: AC units
    const { count: airesCount } = await supabase
      .from('stock_ac_units')
      .select('*', { count: 'exact', head: true })
    const { data: airesSum } = await supabase
      .from('stock_ac_units')
      .select('valor')
    const airesValor = (airesSum ?? []).reduce(
      (acc, r) => acc + (r.valor ?? 0),
      0
    )

    // Stock: tools
    const { count: herramientasCount } = await supabase
      .from('stock_tools')
      .select('*', { count: 'exact', head: true })
    const { data: herramientasSum } = await supabase
      .from('stock_tools')
      .select('valor')
    const herramientasValor = (herramientasSum ?? []).reduce(
      (acc, r) => acc + (r.valor ?? 0),
      0
    )

    // Stock: inmuebles by type
    // First get inmueble type IDs
    const { data: inmuebleTypes } = await supabase
      .from('inmueble_types')
      .select('id, nombre')

    const typeMap: Record<string, number> = {}
    for (const t of inmuebleTypes ?? []) {
      typeMap[t.nombre] = t.id
    }

    // Fincas
    const fincaTypeId = typeMap['Finca']
    let fincasCount = 0
    let fincasValor = 0
    if (fincaTypeId) {
      const { count } = await supabase
        .from('stock_inmuebles')
        .select('*', { count: 'exact', head: true })
        .eq('inmueble_type_id', fincaTypeId)
      fincasCount = count ?? 0
      const { data: fincasSum } = await supabase
        .from('stock_inmuebles')
        .select('valor')
        .eq('inmueble_type_id', fincaTypeId)
      fincasValor = (fincasSum ?? []).reduce(
        (acc, r) => acc + (r.valor ?? 0),
        0
      )
    }

    // Terrenos
    const terrenoTypeId = typeMap['Tierra']
    let terrenosCount = 0
    let terrenosValor = 0
    if (terrenoTypeId) {
      const { count } = await supabase
        .from('stock_inmuebles')
        .select('*', { count: 'exact', head: true })
        .eq('inmueble_type_id', terrenoTypeId)
      terrenosCount = count ?? 0
      const { data: terrenosSum } = await supabase
        .from('stock_inmuebles')
        .select('valor')
        .eq('inmueble_type_id', terrenoTypeId)
      terrenosValor = (terrenosSum ?? []).reduce(
        (acc, r) => acc + (r.valor ?? 0),
        0
      )
    }

    // Edificios
    const edificioTypeId = typeMap['Edificio']
    let edificiosCount = 0
    let edificiosValor = 0
    if (edificioTypeId) {
      const { count } = await supabase
        .from('stock_inmuebles')
        .select('*', { count: 'exact', head: true })
        .eq('inmueble_type_id', edificioTypeId)
      edificiosCount = count ?? 0
      const { data: edificiosSum } = await supabase
        .from('stock_inmuebles')
        .select('valor')
        .eq('inmueble_type_id', edificioTypeId)
      edificiosValor = (edificiosSum ?? []).reduce(
        (acc, r) => acc + (r.valor ?? 0),
        0
      )
    }

    // Descarte: locations count
    const { count: ubicacionesCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })

    // Descarte: waste_items aggregation
    const { data: wasteItems } = await supabase
      .from('waste_items')
      .select('volume, weight, value')
    const descarte = (wasteItems ?? []).reduce(
      (acc, r) => ({
        volumen: acc.volumen + (r.volume ?? 0),
        peso: acc.peso + (r.weight ?? 0),
        valor: acc.valor + (r.value ?? 0),
      }),
      { volumen: 0, peso: 0, valor: 0 }
    )

    return NextResponse.json({
      stock: {
        vehiculos: { count: vehiculosCount ?? 0, valor: vehiculosValor },
        aires: { count: airesCount ?? 0, valor: airesValor },
        herramientas: { count: herramientasCount ?? 0, valor: herramientasValor },
        fincas: { count: fincasCount, valor: fincasValor },
        terrenos: { count: terrenosCount, valor: terrenosValor },
        edificios: { count: edificiosCount, valor: edificiosValor },
      },
      descarte: {
        ubicaciones: ubicacionesCount ?? 0,
        volumen: descarte.volumen,
        peso: descarte.peso,
        valor: descarte.valor,
      },
    })
  } catch (err) {
    console.error('Error fetching dashboard stats:', err)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
