'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ImportRow {
  nombre_institucion: string
  direccion: string
  ciudad: string
  municipio: string
  corregimiento?: string
  latitud: number
  longitud: number
  volumen: number
  peso_estimado: number
  costo_valor: number
  contacto_responsable: string
  nombre_responsable: string
  tipos_residuos: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface BulkImportProps {
  onImport: (data: ImportRow[]) => Promise<{ success: number; errors: number }>
  templateUrl?: string
}

export function BulkImport({ onImport, templateUrl }: BulkImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null)
  const [progress, setProgress] = useState(0)

  const requiredFields = [
    'nombre_institucion',
    'direccion',
    'ciudad',
    'municipio',
    'latitud',
    'longitud',
    'volumen',
    'peso_estimado',
    'costo_valor',
    'contacto_responsable',
    'nombre_responsable',
    'tipos_residuos',
  ]

  const validateRow = (row: Partial<ImportRow>, index: number): ValidationError[] => {
    const errors: ValidationError[] = []

    requiredFields.forEach((field) => {
      if (!row[field as keyof ImportRow]) {
        errors.push({
          row: index + 2,
          field,
          message: `Campo requerido: ${field}`,
        })
      }
    })

    if (row.latitud && (isNaN(row.latitud) || row.latitud < -90 || row.latitud > 90)) {
      errors.push({
        row: index + 2,
        field: 'latitud',
        message: 'Latitud inválida (debe estar entre -90 y 90)',
      })
    }

    if (row.longitud && (isNaN(row.longitud) || row.longitud < -180 || row.longitud > 180)) {
      errors.push({
        row: index + 2,
        field: 'longitud',
        message: 'Longitud inválida (debe estar entre -180 y 180)',
      })
    }

    return errors
  }

  const processFile = async (file: File) => {
    setIsValidating(true)
    setValidationErrors([])
    setImportResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportRow[]

      // Validate data
      const allErrors: ValidationError[] = []
      jsonData.forEach((row, index) => {
        const rowErrors = validateRow(row, index)
        allErrors.push(...rowErrors)
      })

      setPreviewData(jsonData.slice(0, 5))
      setValidationErrors(allErrors)
    } catch (error) {
      setValidationErrors([{
        row: 0,
        field: 'file',
        message: 'Error al procesar el archivo. Verifica el formato.',
      }])
    } finally {
      setIsValidating(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setFile(file)
      processFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  })

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    setProgress(0)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportRow[]

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const result = await onImport(jsonData)
      setImportResult(result)
      setProgress(100)
    } catch (error) {
      setValidationErrors([{
        row: 0,
        field: 'import',
        message: 'Error al importar los datos. Intenta nuevamente.',
      }])
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        nombre_institucion: 'Ejemplo Institución',
        direccion: 'Calle Principal 123',
        ciudad: 'Panamá',
        municipio: 'Panamá',
        corregimiento: 'Bella Vista',
        latitud: 8.9936,
        longitud: -79.5197,
        volumen: 100.5,
        peso_estimado: 500.0,
        costo_valor: 1500.0,
        contacto_responsable: '123-4567',
        nombre_responsable: 'Juan Pérez',
        tipos_residuos: 'Electrónico, Plástico',
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
    XLSX.writeFile(wb, 'plantilla_ubicaciones.xlsx')
  }

  const reset = () => {
    setFile(null)
    setPreviewData([])
    setValidationErrors([])
    setImportResult(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
            <li>Descarga la plantilla y completa los datos</li>
            <li>Los campos marcados con * son obligatorios</li>
            <li>Para tipos de residuos, separa con comas</li>
            <li>Coordenadas deben estar en formato decimal</li>
            <li>El archivo debe ser en formato Excel (.xlsx) o CSV</li>
          </ul>
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla
          </Button>
        </CardContent>
      </Card>

      {/* Upload Area */}
      {!file && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-red-600 bg-red-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
          `}
        >
          <input {...getInputProps()} />
          <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-red-700 font-medium">Suelta el archivo aquí...</p>
          ) : (
            <>
              <p className="text-slate-600 font-medium">
                Arrastra y suelta un archivo aquí, o haz clic para seleccionar
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Archivos soportados: .xlsx, .xls, .csv
              </p>
            </>
          )}
        </div>
      )}

      {/* File Info & Preview */}
      {file && !importResult && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-red-600" />
                <div>
                  <CardTitle className="text-base">{file.name}</CardTitle>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={reset}
                disabled={isImporting}
              >
                <XCircle className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se encontraron {validationErrors.length} errores de validación.
                Corrige los errores antes de importar.
              </AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Errores de Validación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[200px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Fila</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationErrors.slice(0, 10).map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {error.field}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {error.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {validationErrors.length > 10 && (
                    <p className="text-sm text-slate-500 text-center py-2">
                      ... y {validationErrors.length - 10} errores más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vista Previa (Primeras 5 filas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Institución</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>Volumen</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Tipos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium truncate max-w-[200px]">
                            {row.nombre_institucion}
                          </TableCell>
                          <TableCell>{row.ciudad}</TableCell>
                          <TableCell>{row.volumen} m³</TableCell>
                          <TableCell>${row.costo_valor}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {row.tipos_residuos?.split(',').slice(0, 2).map((tipo, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tipo.trim()}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-500 text-center">
                Importando datos... {progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          {validationErrors.length === 0 && (
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={isImporting || isValidating}
                className="bg-red-600 hover:bg-red-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Datos
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className={importResult.errors > 0 ? 'border-yellow-500' : 'border-red-600'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.errors > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Importación Completada con Advertencias
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-red-600" />
                  Importación Exitosa
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-700">
                  {importResult.success}
                </p>
                <p className="text-sm text-red-800">Registros importados</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {importResult.errors}
                </p>
                <p className="text-sm text-red-700">Registros con error</p>
              </div>
            </div>
            <Button onClick={reset} className="w-full">
              Importar Otro Archivo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
