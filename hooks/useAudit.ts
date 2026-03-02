'use client'

import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/lib/services/audit-service'

interface AuditFilters {
  entityType?: string
  action?: string
  userId?: string
  page?: number
  limit?: number
}

export function useAudit(filters?: AuditFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', filters],
    queryFn: () => auditService.getAuditLogs(filters),
  })

  return {
    auditLogs: data?.data || [],
    totalCount: data?.count || 0,
    isLoading,
    error,
  }
}
