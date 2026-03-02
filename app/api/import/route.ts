import { NextRequest, NextResponse } from 'next/server'
import { importService } from '@/lib/services/import-service'
import { locationService } from '@/lib/services/location-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Parse file
    const rows = await importService.parseImportFile(file)
    
    // Validate data
    const { valid, errors } = importService.validateImportData(rows)

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors: errors,
          totalRows: rows.length,
          validRows: valid.length
        },
        { status: 400 }
      )
    }

    // Import valid rows
    const imported = []
    for (const row of valid) {
      const location = await locationService.createLocation({
        nombre_institucion: row.nombre_institucion,
        direccion: row.direccion,
        latitud: row.latitud,
        longitud: row.longitud,
        ciudad: row.ciudad,
        municipio: row.municipio,
        corregimiento: row.corregimiento,
        volumen: row.volumen,
        peso_estimado: row.peso_estimado,
        costo_valor: row.costo_valor,
        contacto_responsable: row.contacto_responsable,
        nombre_responsable: row.nombre_responsable,
      })
      imported.push(location)
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      totalRows: rows.length
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    )
  }
}
