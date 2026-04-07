import { useQuery } from '@tanstack/react-query'

interface StockCategory {
  count: number
  valor: number
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
