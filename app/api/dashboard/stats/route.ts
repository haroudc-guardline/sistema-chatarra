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

// "Valor que suma" de un inmueble: el avalúo vigente manda; si no, la suma del
// desglose (terreno + mejoras); si no, el valor capturado manualmente.
type InmuebleValorRow = {
  valor?: number | null
  avaluo_vigente_monto?: number | null
  valor_terreno?: number | null
  valor_mejoras?: number | null
}
const INMUEBLE_VALOR_SELECT = 'valor, avaluo_vigente_monto, valor_terreno, valor_mejoras'
function sumInmuebleValor(rows: InmuebleValorRow[] | null): number {
  return (rows ?? []).reduce((acc, r) => {
    if (r.avaluo_vigente_monto != null) return acc + r.avaluo_vigente_monto
    if (r.valor_terreno != null || r.valor_mejoras != null) return acc + (r.valor_terreno ?? 0) + (r.valor_mejoras ?? 0)
    return acc + (r.valor ?? 0)
  }, 0)
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
        .select(INMUEBLE_VALOR_SELECT)
        .eq('inmueble_type_id', fincaTypeId)
      fincasValor = sumInmuebleValor(fincasSum)
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
        .select(INMUEBLE_VALOR_SELECT)
        .eq('inmueble_type_id', terrenoTypeId)
      terrenosValor = sumInmuebleValor(terrenosSum)
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
        .select(INMUEBLE_VALOR_SELECT)
        .eq('inmueble_type_id', edificioTypeId)
      edificiosValor = sumInmuebleValor(edificiosSum)
    }

    // Descarte: locations count + geographic distribution
    const { count: ubicacionesCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    const { data: locationGeo } = await supabase
      .from('locations')
      .select('ciudad, municipio')
    const ciudadesSet = new Set((locationGeo ?? []).map(l => l.ciudad).filter(Boolean))
    const municipiosSet = new Set((locationGeo ?? []).map(l => l.municipio).filter(Boolean))

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

    // Waste items by type (for chart)
    const { data: wasteByTypeRaw } = await supabase
      .from('waste_items')
      .select('waste_type_id, volume, weight, value')
    const { data: wasteTypes } = await supabase
      .from('waste_types')
      .select('id, nombre')
    const wasteTypeMap: Record<number, string> = {}
    for (const wt of wasteTypes ?? []) {
      wasteTypeMap[wt.id] = wt.nombre
    }
    const wasteByTypeAgg: Record<string, { nombre: string; count: number; weight: number; value: number }> = {}
    for (const item of wasteByTypeRaw ?? []) {
      const nombre = wasteTypeMap[item.waste_type_id] ?? 'Otros'
      if (!wasteByTypeAgg[nombre]) {
        wasteByTypeAgg[nombre] = { nombre, count: 0, weight: 0, value: 0 }
      }
      wasteByTypeAgg[nombre].count += 1
      wasteByTypeAgg[nombre].weight += item.weight ?? 0
      wasteByTypeAgg[nombre].value += item.value ?? 0
    }
    const wasteByType = Object.values(wasteByTypeAgg).sort((a, b) => b.weight - a.weight)

    // Activity from audit logs
    const { count: auditTotal } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
    const { data: auditActions } = await supabase
      .from('audit_logs')
      .select('action')
    const creates = (auditActions ?? []).filter(a => a.action === 'CREATE').length
    const updates = (auditActions ?? []).filter(a => a.action === 'UPDATE').length

    // Parts totals
    const { data: vParts } = await supabase.from('vehicle_parts').select('cantidad')
    const { data: aParts } = await supabase.from('ac_unit_parts').select('cantidad')
    const { data: tParts } = await supabase.from('tool_parts').select('cantidad')
    const totalParts =
      (vParts ?? []).reduce((s, r) => s + (r.cantidad ?? 0), 0) +
      (aParts ?? []).reduce((s, r) => s + (r.cantidad ?? 0), 0) +
      (tParts ?? []).reduce((s, r) => s + (r.cantidad ?? 0), 0)

    // Grand totals
    const totalStockValue = vehiculosValor + airesValor + herramientasValor + fincasValor + terrenosValor + edificiosValor
    const totalStockItems = (vehiculosCount ?? 0) + (airesCount ?? 0) + (herramientasCount ?? 0) + fincasCount + terrenosCount + edificiosCount
    const totalDescarteItems = (wasteItems ?? []).length

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
      summary: {
        grandTotal: totalStockValue + descarte.valor,
        totalStockValue,
        totalStockItems,
        totalDescarteItems,
      },
      wasteByType,
      activity: {
        total: auditTotal ?? 0,
        creates,
        updates,
      },
      geography: {
        locations: ubicacionesCount ?? 0,
        cities: ciudadesSet.size,
        municipios: municipiosSet.size,
      },
      parts: {
        total: totalParts,
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
