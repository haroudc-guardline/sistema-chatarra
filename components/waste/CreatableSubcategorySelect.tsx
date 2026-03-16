'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'

interface Subcategory {
  id: number
  nombre: string
  waste_type_id: number
}

interface CreatableSubcategorySelectProps {
  wasteTypeId: number | null
  value: string
  onChange: (value: string) => void
}

export function CreatableSubcategorySelect({ wasteTypeId, value, onChange }: CreatableSubcategorySelectProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubcategories = useCallback(async () => {
    if (!wasteTypeId) {
      setSubcategories([])
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/waste-types/${wasteTypeId}/subcategories`)
      if (res.ok) {
        const data = await res.json()
        setSubcategories(data)
      }
    } catch {
      setSubcategories([])
    } finally {
      setIsLoading(false)
    }
  }, [wasteTypeId])

  useEffect(() => {
    fetchSubcategories()
    onChange('')
    setShowCreateInput(false)
    setNewName('')
    setError(null)
  }, [wasteTypeId])

  const handleCreate = async () => {
    if (!newName.trim() || !wasteTypeId) return
    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/waste-types/${wasteTypeId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newName.trim() }),
      })
      if (res.status === 409) {
        setError('Ya existe esta subcategoría')
        return
      }
      if (!res.ok) throw new Error()
      const created = await res.json()
      setSubcategories(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      onChange(created.nombre)
      setNewName('')
      setShowCreateInput(false)
    } catch {
      setError('Error al crear subcategoría')
    } finally {
      setIsCreating(false)
    }
  }

  if (!wasteTypeId) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un tipo primero" />
        </SelectTrigger>
      </Select>
    )
  }

  if (showCreateInput) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(null) }}
            placeholder="Nombre de la nueva subcategoría"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
            disabled={isCreating}
            autoFocus
          />
          <Button type="button" size="sm" onClick={handleCreate} disabled={isCreating || !newName.trim()}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setShowCreateInput(false); setError(null) }}>
            Cancelar
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select
        value={value || 'no-subcategoria'}
        onValueChange={(v) => {
          if (v === '__create_new__') {
            setShowCreateInput(true)
          } else {
            onChange(v === 'no-subcategoria' ? '' : v)
          }
        }}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Cargando...' : 'Selecciona subcategoría'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-subcategoria">Sin especificar (opcional)</SelectItem>
          {subcategories.map((sc) => (
            <SelectItem key={sc.id} value={sc.nombre}>
              {sc.nombre}
            </SelectItem>
          ))}
          <SelectItem value="__create_new__" className="text-blue-600 font-medium">
            + Crear nueva subcategoría
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
