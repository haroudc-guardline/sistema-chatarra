import { supabase } from '@/lib/supabase/client'
import type { AuditLog } from '@/types/database'

export const auditService = {
  // Get all audit logs with pagination
  async getAuditLogs(options?: {
    limit?: number
    offset?: number
    entityType?: string
    action?: string
    userId?: string
  }) {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id(nombre, email)
      `)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    if (options?.entityType) {
      query = query.eq('entity_type', options.entityType)
    }
    if (options?.action) {
      query = query.eq('action', options.action)
    }
    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data, error, count } = await query

    if (error) throw error
    return { data: data as AuditLog[], count }
  },

  // Get audit logs for specific entity
  async getEntityAuditLogs(entityType: string, entityId: number) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id(nombre, email)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as AuditLog[]
  },

  // Get recent activity (for dashboard)
  async getRecentActivity(limit: number = 10) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id(nombre, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as AuditLog[]
  }
}
