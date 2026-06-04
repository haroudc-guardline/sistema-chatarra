'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inmuebleService, type InmuebleSearchFilters } from '@/lib/services/inmueble-service'

export function useInmuebleSearch(filters: InmuebleSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockInmuebles', filters],
    queryFn: () => inmuebleService.searchInmuebles(filters),
    staleTime: 30 * 1000,
  })
  return {
    items: data?.data ?? [],
    totalCount: data?.count ?? 0,
    isLoading,
    error,
    refetch,
  }
}

export function useInmuebleMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stockInmuebles'] })

  const create = useMutation({
    mutationFn: inmuebleService.createInmueble,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof inmuebleService.updateInmueble>[1] }) =>
      inmuebleService.updateInmueble(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: inmuebleService.deleteInmueble,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export function useInmuebleTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inmuebleTypes'],
    queryFn: () => inmuebleService.getInmuebleTypes(),
    staleTime: 5 * 60 * 1000,
  })
  return { types: data ?? [], isLoading, error }
}

export function useInmuebleTypeMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inmuebleTypes'] })

  const create = useMutation({
    mutationFn: (nombre: string) => inmuebleService.createInmuebleType(nombre),
    onSuccess: invalidate,
  })

  return { create }
}

export function useInmuebleActivoTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inmuebleActivoTypes'],
    queryFn: () => inmuebleService.getActivoTypes(),
    staleTime: 5 * 60 * 1000,
  })
  return { types: data ?? [], isLoading, error }
}

export function useInmuebleActivoTypeMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inmuebleActivoTypes'] })

  const create = useMutation({
    mutationFn: (nombre: string) => inmuebleService.createActivoType(nombre),
    onSuccess: invalidate,
  })

  return { create }
}

// ===== Avalúos =====
export function useInmuebleAvaluos(inmuebleId: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inmuebleAvaluos', inmuebleId],
    queryFn: () => inmuebleService.getAvaluos(inmuebleId),
    enabled: !!inmuebleId,
  })
  return { avaluos: data ?? [], isLoading, error, refetch }
}

export function useInmuebleAvaluoMutations(inmuebleId: number) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inmuebleAvaluos', inmuebleId] })
    queryClient.invalidateQueries({ queryKey: ['stockInmueble', String(inmuebleId)] })
    queryClient.invalidateQueries({ queryKey: ['stockInmuebles'] })
  }
  const create = useMutation({
    mutationFn: (data: Parameters<typeof inmuebleService.createAvaluo>[1]) => inmuebleService.createAvaluo(inmuebleId, data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ avaluoId, data }: { avaluoId: number; data: Parameters<typeof inmuebleService.updateAvaluo>[2] }) =>
      inmuebleService.updateAvaluo(inmuebleId, avaluoId, data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (avaluoId: number) => inmuebleService.deleteAvaluo(inmuebleId, avaluoId),
    onSuccess: invalidate,
  })
  return { create, update, remove }
}

// ===== Documentos + tipos =====
export function useInmuebleDocumentTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inmuebleDocumentTypes'],
    queryFn: () => inmuebleService.getDocumentTypes(),
    staleTime: 5 * 60 * 1000,
  })
  return { types: data ?? [], isLoading, error }
}

export function useInmuebleDocumentTypeMutations() {
  const queryClient = useQueryClient()
  const create = useMutation({
    mutationFn: (nombre: string) => inmuebleService.createDocumentType(nombre),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inmuebleDocumentTypes'] }),
  })
  return { create }
}

export function useInmuebleDocuments(inmuebleId: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inmuebleDocuments', inmuebleId],
    queryFn: () => inmuebleService.getDocuments(inmuebleId),
    enabled: !!inmuebleId,
  })
  return { documents: data ?? [], isLoading, error, refetch }
}

export function useInmuebleDocumentMutations(inmuebleId: number) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inmuebleDocuments', inmuebleId] })
    queryClient.invalidateQueries({ queryKey: ['stockInmuebles'] })
  }
  const upload = useMutation({
    mutationFn: ({ documentTypeId, files }: { documentTypeId: number; files: File[] }) =>
      inmuebleService.uploadDocuments(inmuebleId, documentTypeId, files),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (documentId: number) => inmuebleService.deleteDocument(inmuebleId, documentId),
    onSuccess: invalidate,
  })
  return { upload, remove }
}

// ===== Media =====
export function useInmuebleMedia(inmuebleId: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inmuebleMedia', inmuebleId],
    queryFn: () => inmuebleService.getMedia(inmuebleId),
    enabled: !!inmuebleId,
  })
  return { media: data ?? [], isLoading, error, refetch }
}

export function useInmuebleMediaMutations(inmuebleId: number) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inmuebleMedia', inmuebleId] })
  const upload = useMutation({
    mutationFn: ({ categoria, files }: { categoria: string; files: File[] }) =>
      inmuebleService.uploadMedia(inmuebleId, categoria, files),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (mediaId: number) => inmuebleService.deleteMedia(inmuebleId, mediaId),
    onSuccess: invalidate,
  })
  return { upload, remove }
}

// ===== Radiografía =====
export function useInmuebleRadiografia(filters: Parameters<typeof inmuebleService.getRadiografia>[0] = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inmuebleRadiografia', filters],
    queryFn: () => inmuebleService.getRadiografia(filters),
    staleTime: 30 * 1000,
  })
  return { report: data, isLoading, error, refetch }
}
