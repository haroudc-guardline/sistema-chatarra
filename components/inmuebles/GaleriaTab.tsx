'use client'

import { useRef, useState } from 'react'
import { useInmuebleMedia, useInmuebleMediaMutations } from '@/hooks/useInmuebles'
import { MEDIA_CATEGORIAS } from '@/lib/inmueble-constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, Trash2, Image as ImageIcon, Video } from 'lucide-react'
import type { InmuebleMedia } from '@/types/database'

export function GaleriaTab({ inmuebleId, canEdit }: { inmuebleId: number; canEdit: boolean }) {
  const { media, isLoading } = useInmuebleMedia(inmuebleId)
  const { upload, remove } = useInmuebleMediaMutations(inmuebleId)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [uploadCat, setUploadCat] = useState<string>('Fachada')
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const filtered = filterCat === 'all' ? media : media.filter((m) => m.categoria === filterCat)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      await upload.mutateAsync({ categoria: uploadCat, files: Array.from(files) })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir archivo')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleDelete = async (m: InmuebleMedia) => {
    if (!confirm(`¿Eliminar "${m.file_name}"?`)) return
    await remove.mutateAsync(m.id)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Filtrar por categoría</Label>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="h-8 text-xs w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {MEDIA_CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Categoría a subir</Label>
              <Select value={uploadCat} onValueChange={setUploadCat}>
                <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEDIA_CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button size="sm" className="h-8" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-3.5 w-3.5 mr-1" /> Subir foto/video</>}
            </Button>
          </div>
        )}
      </div>
      {canEdit && <p className="text-xs text-slate-400">Imágenes hasta 5MB · video hasta 200MB (clip corto, ideal para tomas con dron).</p>}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <ImageIcon className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No hay fotos ni videos en esta categoría</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((m) => (
            <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-slate-50">
              {m.media_type === 'video' ? (
                <video src={m.public_url} controls className="w-full h-36 object-cover bg-black" />
              ) : (
                <img src={m.public_url} alt={m.file_name} className="w-full h-36 object-cover" />
              )}
              <div className="absolute top-1 left-1 flex items-center gap-1">
                <Badge className="bg-black/60 text-white text-[10px] px-1.5 py-0 flex items-center gap-1">
                  {m.media_type === 'video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  {m.categoria}
                </Badge>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDelete(m)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
