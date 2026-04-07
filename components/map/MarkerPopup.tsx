import type { LocationWithDetails } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface MarkerPopupProps {
  location: LocationWithDetails
}

export function MarkerPopup({ location }: MarkerPopupProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-blue-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">
              {location.nombre_institucion}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {location.direccion}
            </p>
          </div>
        </div>

        <div className="mt-3 text-sm text-slate-600">
          <p>{location.ciudad} — {location.municipio}</p>
          {location.nombre_responsable && (
            <p className="mt-1 text-slate-500">Responsable: {location.nombre_responsable}</p>
          )}
        </div>

        {location.waste_types && location.waste_types.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-medium mb-2">
              Tipos de residuos:
            </p>
            <div className="flex flex-wrap gap-1">
              {location.waste_types.map((wt) => (
                <Badge
                  key={wt.id}
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-800"
                >
                  {wt.nombre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <a
          href={`/locations/${location.id}`}
          className="mt-4 block w-full text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Ver Detalles
        </a>
      </CardContent>
    </Card>
  )
}
