// ============================================
// 🔥 HOOK: useAuditLog - DOGMA IX
// Consulta de Logs de Auditoria (Owner Only)
// ============================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
  metadata: unknown;
  created_at: string;
}

interface AuditLogFilters {
  tableName?: string;
  userId?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export const useAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar logs de auditoria (Owner Only)
   */
  const fetchAuditLogs = useCallback(async (filters: AuditLogFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_audit_logs', {
        p_table_name: filters.tableName || null,
        p_user_id: filters.userId || null,
        p_action: filters.action || null,
        p_from_date: filters.fromDate?.toISOString() || null,
        p_to_date: filters.toDate?.toISOString() || null,
        p_limit: filters.limit || 100
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setLogs(data || []);
      return data;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar logs';
      setError(message);
      
      if (message.includes('Acesso negado')) {
        toast.error('Acesso negado', { description: 'Apenas o Owner pode consultar logs de auditoria' });
      } else {
        toast.error('Erro ao buscar logs', { description: message });
      }
      
      return [];

    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buscar logs por tabela específica
   */
  const getLogsByTable = useCallback((tableName: string, limit = 50) => {
    return fetchAuditLogs({ tableName, limit });
  }, [fetchAuditLogs]);

  /**
   * Buscar logs por usuário
   */
  const getLogsByUser = useCallback((userId: string, limit = 50) => {
    return fetchAuditLogs({ userId, limit });
  }, [fetchAuditLogs]);

  /**
   * Buscar logs de ações específicas
   */
  const getLogsByAction = useCallback((action: string, limit = 50) => {
    return fetchAuditLogs({ action, limit });
  }, [fetchAuditLogs]);

  /**
   * Logar acesso a relatório
   */
  const logReportAccess = useCallback(async (reportType: string, params: Record<string, any> = {}) => {
    try {
      await supabase.rpc('log_report_access', {
        p_report_type: reportType,
        p_report_params: params
      });
      console.log(`📊 Acesso a relatório logado: ${reportType}`);
    } catch (err) {
      console.warn('Erro ao logar acesso a relatório:', err);
    }
  }, []);

  /**
   * Estatísticas de auditoria
   */
  const getAuditStats = useCallback(async (days = 7) => {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const allLogs = await fetchAuditLogs({ fromDate, limit: 10000 }); // ESCALA 45K
      
      // Agrupar por ação
      const byAction: Record<string, number> = {};
      // Agrupar por tabela
      const byTable: Record<string, number> = {};
      // Agrupar por usuário
      const byUser: Record<string, number> = {};
      
      allLogs.forEach(log => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
        byTable[log.table_name] = (byTable[log.table_name] || 0) + 1;
        byUser[log.user_email] = (byUser[log.user_email] || 0) + 1;
      });
      
      return {
        total: allLogs.length,
        byAction,
        byTable,
        byUser,
        period: `${days} dias`
      };
      
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err);
      return null;
    }
  }, [fetchAuditLogs]);

  return {
    logs,
    isLoading,
    error,
    fetchAuditLogs,
    getLogsByTable,
    getLogsByUser,
    getLogsByAction,
    logReportAccess,
    getAuditStats
  };
};

export default useAuditLog;
