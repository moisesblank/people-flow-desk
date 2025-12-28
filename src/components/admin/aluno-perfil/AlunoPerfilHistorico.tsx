// ============================================
// SEÇÃO HISTÓRICO DE ALTERAÇÕES DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, FileEdit, UserCog, Shield, DollarSign,
  ArrowRight, Clock, User, Settings
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlunoHistoricoProps {
  userId: string | null;
  alunoId: string;
  alunoEmail: string;
}

export function AlunoPerfilHistorico({ userId, alunoId, alunoEmail }: AlunoHistoricoProps) {
  // Buscar logs de auditoria do usuário
  const { data: auditLogs } = useQuery({
    queryKey: ['aluno-audit-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar logs de atividade
  const { data: activityLogs } = useQuery({
    queryKey: ['aluno-activity-history', alunoEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_email', alunoEmail)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!alunoEmail
  });

  // Buscar auditoria de grupo beta
  const { data: betaAudits } = useQuery({
    queryKey: ['aluno-beta-audit', alunoEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from('auditoria_grupo_beta')
        .select('*')
        .eq('email', alunoEmail)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!alunoEmail
  });

  const allLogs = [
    ...(auditLogs || []).map((l: any) => ({ ...l, source: 'audit' })),
    ...(activityLogs || []).map((l: any) => ({ ...l, source: 'activity' })),
    ...(betaAudits || []).map((l: any) => ({ ...l, source: 'beta' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const hasData = allLogs.length > 0;

  const getActionIcon = (action: string, source: string) => {
    if (source === 'beta') return <Shield className="h-4 w-4 text-yellow-400" />;
    if (action?.includes('role') || action?.includes('permission')) return <UserCog className="h-4 w-4 text-purple-400" />;
    if (action?.includes('payment') || action?.includes('financial')) return <DollarSign className="h-4 w-4 text-green-400" />;
    if (action?.includes('update') || action?.includes('edit')) return <FileEdit className="h-4 w-4 text-blue-400" />;
    return <Settings className="h-4 w-4 text-muted-foreground" />;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'audit':
        return <Badge variant="outline" className="text-xs">Auditoria</Badge>;
      case 'activity':
        return <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400">Atividade</Badge>;
      case 'beta':
        return <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-400">Beta</Badge>;
      default:
        return null;
    }
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <History className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Histórico de Alterações</h3>
          <p className="text-sm text-muted-foreground">Auditoria de todas as mudanças no perfil</p>
        </div>
      </div>

      {!hasData ? (
        <PresetEmptyState preset="noData" />
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            
            {/* Log Items */}
            <div className="space-y-4">
              {allLogs.map((log: any, index: number) => (
                <div key={`${log.source}-${log.id}-${index}`} className="relative pl-10">
                  {/* Timeline Dot */}
                  <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  
                  {/* Log Card */}
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-border transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action || log.tipo_discrepancia || log.acao_tomada, log.source)}
                        <span className="text-sm font-medium text-foreground">
                          {log.action || log.tipo_discrepancia || log.acao_tomada || 'Ação'}
                        </span>
                        {getSourceBadge(log.source)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-1">
                      {log.table_name && (
                        <p className="text-xs text-muted-foreground">
                          Tabela: <span className="text-foreground">{log.table_name}</span>
                        </p>
                      )}
                      
                      {/* Show old vs new data for updates */}
                      {log.old_data && log.new_data && (
                        <div className="flex items-center gap-2 text-xs mt-2">
                          <span className="text-red-400/70 line-through">
                            {typeof log.old_data === 'object' ? JSON.stringify(log.old_data).slice(0, 50) : log.old_data}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-green-400">
                            {typeof log.new_data === 'object' ? JSON.stringify(log.new_data).slice(0, 50) : log.new_data}
                          </span>
                        </div>
                      )}
                      
                      {/* Beta audit specific */}
                      {log.source === 'beta' && (
                        <div className="mt-2 space-y-1 text-xs">
                          {log.status_anterior && (
                            <p className="text-muted-foreground">
                              Status: <span className="text-red-400">{log.status_anterior}</span>
                              <ArrowRight className="h-3 w-3 inline mx-1" />
                              <span className="text-green-400">{log.status_novo}</span>
                            </p>
                          )}
                          {log.executado_por && (
                            <p className="text-muted-foreground">
                              Por: <span className="text-foreground">{log.executado_por}</span>
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* IP and metadata */}
                      {log.ip_address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: {log.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </FuturisticCard>
  );
}
