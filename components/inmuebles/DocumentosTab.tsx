'use client'

import { useRef, useState } from 'react'
import {
  useInmuebleDocumentTypes, useInmuebleDocuments, useInmuebleDocumentMutations, useInmuebleDocumentTypeMutations,
} from '@/hooks/useInmuebles'
import { useInmuebleAvaluos } from '@/hooks/useInmuebles'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, Circle, FileText, Upload, Trash2, Plus } from 'lucide-react'
import type { InmuebleDocument, InmuebleDocumentType } from '@/types/database'

export function DocumentosTab({ inmuebleId, canEdit }: { inmuebleId: number; canEdit: boolean }) {
  const { types, isLoading: typesLoading } = useInmuebleDocumentTypes()
  const { documents, isLoading: docsLoading } = useInmuebleDocuments(inmuebleId)
  const { upload, remove } = useInmuebleDocumentMutations(inmuebleId)
  const { create: createType } = useInmuebleDocumentTypeMutations()
  // El tipo "Avalúo" se satisface desde el historial de avalúos (no se duplica el PDF)
  const { avaluos } = useInmuebleAvaluos(inmuebleId)

  const [uploadingTypeId, setUploadingTypeId] = useState<number | null>(null)
  const [showNewType, setShowNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({})

  const docsByType = (typeId: number) => documents.filter((d) => d.document_type_id === typeId)

  const hasAvaluoDoc = avaluos.some((a) => a.documento_path)

  const isSatisfied = (t: InmuebleDocumentType) => {
    if (t.nombre === 'Avalúo') return hasAvaluoDoc || docsByType(t.id).length > 0
    return docsByType(t.id).length > 0
  }

  const handleFiles = async (typeId: number, files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadingTypeId(typeId)
    try {
      await upload.mutateAsync({ documentTypeId: typeId, files: Array.from(files) })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir documento')
    } finally {
      setUploadingTypeId(null)
    }
  }

  const handleDelete = async (doc: InmuebleDocument) => {
    if (!confirm(`¿Eliminar "${doc.file_name}"?`)) return
    await remove.mutateAsync(doc.id)
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) return
    try {
      await createType.mutateAsync(newTypeName.trim())
      setNewTypeName('')
      setShowNewType(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al crear tipo')
    }
  }

  if (typesLoading || docsLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
  }

  const completados = types.filter(isSatisfied).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Checklist de documentos — <span className="font-medium text-slate-900">{completados}/{types.length}</span> completados
        </p>
        {canEdit && (
          showNewType ? (
            <div className="flex gap-2">
              <Input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="Nuevo tipo de documento" className="h-8 text-xs w-56" />
              <Button size="sm" className="h-8" onClick={handleAddType} disabled={createType.isPending}>
                {createType.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => setShowNewType(false)}>Cancelar</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowNewType(true)}>
              <Plus className="h-4 w-4 mr-1" /> Agregar tipo
            </Button>
          )
        )}
      </div>

      <div className="space-y-3">
        {types.map((t) => {
          const docs = docsByType(t.id)
          const satisfied = isSatisfied(t)
          return (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {satisfied
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      : <Circle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{t.nombre}</p>
                        {t.is_required && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Requerido</Badge>}
                        {!satisfied && <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">Pendiente</Badge>}
                      </div>
                      {t.nombre === 'Avalúo' && (
                        <p className="text-xs text-slate-400 mt-0.5">Se carga desde la pestaña Avalúos.</p>
                      )}
                      {docs.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {docs.map((d) => (
                            <li key={d.id} className="flex items-center gap-2 text-xs">
                              <a href={d.public_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                <FileText className="h-3.5 w-3.5" /> {d.file_name}
                              </a>
                              {canEdit && (
                                <button onClick={() => handleDelete(d)} className="text-red-500 hover:text-red-700">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  {canEdit && t.nombre !== 'Avalúo' && (
                    <div>
                      <input
                        ref={(el) => { fileInputs.current[t.id] = el }}
                        type="file"
                        multiple
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleFiles(t.id, e.target.files)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs shrink-0"
                        onClick={() => fileInputs.current[t.id]?.click()}
                        disabled={uploadingTypeId === t.id}
                      >
                        {uploadingTypeId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-3.5 w-3.5 mr-1" /> Subir</>}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
