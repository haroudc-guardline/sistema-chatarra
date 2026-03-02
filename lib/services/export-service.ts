import * as XLSX from 'xlsx'
import type { Location, WasteItem } from '@/types/database'

interface LocationWithWasteItems extends Location {
  waste_items?: WasteItem[]
}

export const exportService = {
  // Export locations to Excel
  exportToExcel(data: any[], filename: string = 'locations') {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Locations')
    
    const date = new Date().toISOString().split('T')[0]
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Locations')
    XLSX.writeFile(workbook, `${filename}_${date}.xlsx`)
  },

  // Export locations to CSV
  exportToCSV(data: any[], filename: string = 'locations') {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]
    
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Export locations with detailed waste items (FB-004)
  exportLocationsWithWasteItems(locations: LocationWithWasteItems[], filename: string = 'ubicaciones_con_residuos') {
    const date = new Date().toISOString().split('T')[0]
    const workbook = XLSX.utils.book_new()

    // Sheet 1: Resumen de Ubicaciones
    const locationsSummary = locations.map(loc => ({
      ID: loc.id,
      Institución: loc.nombre_institucion,
      Dirección: loc.direccion,
      Ciudad: loc.ciudad,
      Municipio: loc.municipio,
      Responsable: loc.nombre_responsable,
      Teléfono: loc.telefono_responsable || loc.contacto_responsable || '',
      Email: loc.email_responsable || '',
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
    locations.forEach(loc => {
      if (loc.waste_items && loc.waste_items.length > 0) {
        loc.waste_items.forEach(item => {
          wasteItemsDetail.push({
            'ID Ubicación': loc.id,
            Institución: loc.nombre_institucion,
            'ID Item': item.id,
            'Tipo Residuo': item.waste_type?.nombre || 'N/A',
            Volumen: item.volume,
            'Unidad Volumen': 'm³',
            Peso: item.weight,
            'Unidad Peso': 'kg',
            'Valor ($)': item.value,
            Calidad: item.quality || 'N/A',
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
    locations.forEach(loc => {
      loc.waste_items?.forEach(item => {
        const typeName = item.waste_type?.nombre || 'Sin clasificar'
        if (!wasteTypeSummary.has(typeName)) {
          wasteTypeSummary.set(typeName, {
            'Tipo Residuo': typeName,
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

    XLSX.writeFile(workbook, `${filename}_${date}.xlsx`)
  }
}
