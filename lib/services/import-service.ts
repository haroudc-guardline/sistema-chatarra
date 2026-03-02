import * as XLSX from 'xlsx'
import { z } from 'zod'

const locationImportSchema = z.object({
  nombre_institucion: z.string().min(1),
  direccion: z.string().min(1),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  ciudad: z.string().min(1),
  municipio: z.string().min(1),
  corregimiento: z.string().optional(),
  volumen: z.number().min(0),
  peso_estimado: z.number().min(0),
  costo_valor: z.number().min(0),
  contacto_responsable: z.string().min(1),
  nombre_responsable: z.string().min(1),
  tipo_residuos: z.string().optional() // Comma-separated waste type names
})

export type LocationImportRow = z.infer<typeof locationImportSchema>

export const importService = {
  // Parse import file (CSV or Excel)
  async parseImportFile(file: File): Promise<LocationImportRow[]> {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    return jsonData as LocationImportRow[]
  },

  // Validate import data
  validateImportData(data: any[]): { valid: LocationImportRow[]; errors: { row: number; errors: string[] }[] } {
    const valid: LocationImportRow[] = []
    const errors: { row: number; errors: string[] }[] = []

    data.forEach((row, index) => {
      try {
        // Convert numeric strings to numbers
        const parsedRow = {
          ...row,
          latitud: parseFloat(row.latitud),
          longitud: parseFloat(row.longitud),
          volumen: parseFloat(row.volumen),
          peso_estimado: parseFloat(row.peso_estimado),
          costo_valor: parseFloat(row.costo_valor)
        }

        const validated = locationImportSchema.parse(parsedRow)
        valid.push(validated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: index + 2, // +2 because row 1 is header, and index starts at 0
            errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
          })
        }
      }
    })

    return { valid, errors }
  },

  // Generate template for import
  generateTemplate() {
    const template = [
      {
        nombre_institucion: 'Ministerio de Ejemplo',
        direccion: 'Calle Principal 123',
        latitud: 8.983333,
        longitud: -79.516667,
        ciudad: 'Panamá',
        municipio: 'Panamá',
        corregimiento: 'Bella Vista',
        volumen: 100.5,
        peso_estimado: 500.25,
        costo_valor: 1500.00,
        contacto_responsable: '1234-5678',
        nombre_responsable: 'Juan Pérez',
        tipo_residuos: 'Chatarra metálica ferrosa, Residuos electrónicos'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    XLSX.writeFile(workbook, 'plantilla_importacion_ubicaciones.xlsx')
  }
}
