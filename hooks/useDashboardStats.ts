import { useQuery } from '@tanstack/react-query'

interface StockCategory {
  count: number
  valor: number
}

interface WasteByType {
  nombre: string
  count: number
  weight: number
  value: number
}

interface DashboardStats {
  stock: {
    vehiculos: StockCategory
    aires: StockCategory
    herramientas: StockCategory
    fincas: StockCategory
    terrenos: StockCategory
    edificios: StockCategory
  }
  descarte: {
    ubicaciones: number
    volumen: number
    peso: number
    valor: number
  }
  summary: {
    grandTotal: number
    totalStockValue: number
    totalStockItems: number
    totalDescarteItems: number
  }
  wasteByType: WasteByType[]
  activity: {
    total: number
    creates: number
    updates: number
  }
  geography: {
    locations: number
    cities: number
    municipios: number
  }
  parts: {
    total: number
  }
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Error fetching stats')
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}
