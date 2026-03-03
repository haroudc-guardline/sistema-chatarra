import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/lib/services/location-service'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const detailed = searchParams.get('detailed') === 'true' // FB-004: Export with waste items

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

    // Fetch all locations with waste items if detailed export
    let locations
    if (detailed) {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          waste_items (
            id,
            volume,
            weight,
            value,
            quality,
            created_at,
            waste_type:waste_types (id, nombre, categoria)
          ),
          waste_types (*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      locations = data
    } else {
      locations = await locationService.getLocations()
    }

    if (detailed && format === 'excel') {
      // FB-004: Export with waste items using multi-sheet Excel
      const date = new Date().toISOString().split('T')[0]
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Resumen de Ubicaciones
      const locationsSummary = locations.map((loc: any) => ({
        'ID': loc.id,
        'Nombre Institución': loc.nombre_institucion,
        'Dirección': loc.direccion,
        'Ciudad': loc.ciudad,
        'Municipio': loc.municipio,
        'Corregimiento': loc.corregimiento || '',
        'Responsable': loc.nombre_responsable,
        'Teléfono': loc.telefono_responsable || loc.contacto_responsable || '',
        'Email': loc.email_responsable || '',
        'Volumen Total (m³)': loc.volumen,
        'Peso Total (kg)': loc.peso_estimado,
        'Valor Total ($)': loc.costo_valor,
        'Cantidad Items': loc.waste_items?.length || 0,
        'Última Actualización': loc.ultima_actualizacion || loc.updated_at || loc.created_at
      }))

      const summarySheet = XLSX.utils.json_to_sheet(locationsSummary)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Ubicaciones')

      // Sheet 2: Detalle de Waste Items
      const wasteItemsDetail: any[] = []
      locations.forEach((loc: any) => {
        if (loc.waste_items && loc.waste_items.length > 0) {
          loc.waste_items.forEach((item: any) => {
            wasteItemsDetail.push({
              'ID Ubicación': loc.id,
              'Institución': loc.nombre_institucion,
              'ID Item': item.id,
              'Tipo Residuo': item.waste_type?.nombre || 'N/A',
              'Categoría': item.waste_type?.categoria || 'N/A',
              'Volumen (m³)': item.volume,
              'Peso (kg)': item.weight,
              'Valor ($)': item.value,
              'Calidad': item.quality || 'N/A',
              'Fecha Creación': item.created_at
            })
          })
        }
      })

      if (wasteItemsDetail.length > 0) {
        const detailSheet = XLSX.utils.json_to_sheet(wasteItemsDetail)
        XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle Residuos')
      }

      // Sheet 3: Resumen por Tipo de Residuo
      const wasteTypeSummary = new Map()
      locations.forEach((loc: any) => {
        loc.waste_items?.forEach((item: any) => {
          const typeName = item.waste_type?.nombre || 'Sin clasificar'
          if (!wasteTypeSummary.has(typeName)) {
            wasteTypeSummary.set(typeName, {
              'Tipo Residuo': typeName,
              'Categoría': item.waste_type?.categoria || 'N/A',
              'Total Volumen (m³)': 0,
              'Total Peso (kg)': 0,
              'Total Valor ($)': 0,
              'Cantidad Items': 0
            })
          }
          const summary = wasteTypeSummary.get(typeName)
          summary['Total Volumen (m³)'] += item.volume || 0
          summary['Total Peso (kg)'] += item.weight || 0
          summary['Total Valor ($)'] += item.value || 0
          summary['Cantidad Items'] += 1
        })
      })

      if (wasteTypeSummary.size > 0) {
        const typeSheet = XLSX.utils.json_to_sheet(Array.from(wasteTypeSummary.values()))
        XLSX.utils.book_append_sheet(workbook, typeSheet, 'Resumen por Tipo')
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=ubicaciones_detallado_${date}.xlsx`
        }
      })
    } else {
      // Standard export (original behavior)
      const exportData = locations.map((loc: any) => ({
        'ID': loc.id,
        'Nombre Institución': loc.nombre_institucion,
        'Dirección': loc.direccion,
        'Latitud': loc.latitud,
        'Longitud': loc.longitud,
        'Ciudad': loc.ciudad,
        'Municipio': loc.municipio,
        'Corregimiento': loc.corregimiento || '',
        'Volumen (m³)': loc.volumen,
        'Peso Estimado (kg)': loc.peso_estimado,
        'Costo/Valor': loc.costo_valor,
        'Teléfono': loc.telefono_responsable || loc.contacto_responsable || '',
        'Email': loc.email_responsable || '',
        'Nombre Responsable': loc.nombre_responsable,
        'Fecha Creación': loc.created_at,
        'Última Actualización': loc.ultima_actualizacion
      }))

      if (format === 'csv') {
        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=ubicaciones.csv'
          }
        })
      } else {
        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ubicaciones')
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=ubicaciones.xlsx'
          }
        })
      }
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}
