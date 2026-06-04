'use client'

import { Check } from 'lucide-react'
import type { InmuebleCompletitud } from '@/types/database'

const ITEMS: { key: keyof InmuebleCompletitud; label: string }[] = [
  { key: 'tiene_avaluo_vigente', label: 'Avalúo' },
  { key: 'tiene_plano_catastral', label: 'Plano cat.' },
  { key: 'tiene_escritura', label: 'Escritura' },
  { key: 'tiene_planos_arq', label: 'Planos' },
  { key: 'tiene_titular', label: 'Titular' },
]

export function CompletitudChips({ completitud }: { completitud?: InmuebleCompletitud }) {
  if (!completitud) return <span className="text-xs text-slate-300">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {ITEMS.map(({ key, label }) => {
        const ok = Boolean(completitud[key])
        return (
          <span
            key={key}
            title={ok ? `${label}: completo` : `${label}: pendiente`}
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {ok && <Check className="h-2.5 w-2.5" />}
            {label}
          </span>
        )
      })}
    </div>
  )
}
