'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'
import type { WasteType } from '@/types/database'

interface CreatableWasteTypeSelectProps {
  wasteTypes: WasteType[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  onCreateWasteType: (name: string) => Promise<WasteType | null>
}

export function CreatableWasteTypeSelect({
  wasteTypes,
  selectedIds,
  onChange,
  onCreateWasteType,
}: CreatableWasteTypeSelectProps) {
  const [newTypeName, setNewTypeName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleWasteType = useCallback((id: number) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((tid) => tid !== id)
      : [...selectedIds, id]
    onChange(updated)
  }, [selectedIds, onChange])

  const handleCreateNew = async () => {
    if (!newTypeName.trim()) return
    
    // Check if already exists
    const exists = wasteTypes.find(
      (wt) => wt.nombre.toLowerCase() === newTypeName.trim().toLowerCase()
    )
    if (exists) {
      setError('Este tipo de residuo ya existe')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const newType = await onCreateWasteType(newTypeName.trim())
      if (newType) {
        onChange([...selectedIds, newType.id])
        setNewTypeName('')
      }
    } catch (err) {
      setError('Error al crear el tipo de residuo')
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateNew()
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected and existing types */}
      <div className="flex flex-wrap gap-2">
        {wasteTypes?.map((type) => (
          <Badge
            key={type.id}
            variant={selectedIds.includes(type.id) ? 'default' : 'outline'}
            className={`cursor-pointer select-none ${
              selectedIds.includes(type.id)
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'hover:bg-slate-100'
            }`}
            onClick={() => toggleWasteType(type.id)}
          >
            {type.nombre}
            {selectedIds.includes(type.id) && (
              <X className="ml-1 h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>

      {/* Create new type input */}
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-1">
          <Input
            placeholder="Escribe un nuevo tipo de residuo y presiona Enter..."
            value={newTypeName}
            onChange={(e) => {
              setNewTypeName(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            disabled={isCreating}
          />
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCreateNew}
          disabled={isCreating || !newTypeName.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Haz clic en los tipos existentes para seleccionarlos. Escribe uno nuevo para crearlo.
      </p>
    </div>
  )
}
