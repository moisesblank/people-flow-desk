// ============================================
// SEÇÃO SEGURANÇA E COMPLIANCE DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Lock, Smartphone, Globe, AlertTriangle,
  CheckCircle, XCircle, Clock, Key, Eye, Activity
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlunoSegurancaProps {
  userId: string | null;
  profile: any;
}

export function AlunoPerfilSeguranca({ userId, profile }: AlunoSegurancaProps) {
  // Buscar sessões ativas
  const { data: activeSessions } = useQuery({
    queryKey: ['aluno-active-sessions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false });
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar logs de auditoria
  const { data: auditLogs } = useQuery({
    queryKey: ['aluno-audit-logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar tentativas de acesso por dispositivo
  const { data: deviceAttempts } = useQuery({
    queryKey: ['aluno-device-attempts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('device_access_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar eventos suspeitos
  const { data: suspiciousEvents } = useQuery({
    queryKey: ['aluno-suspicious-events', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('device_suspicious_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar trust scores
  const { data: trustScores } = useQuery({
    queryKey: ['aluno-trust-scores', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('device_trust_scores')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: !!userId
  });

  const totalSessions = activeSessions?.length || 0;
  const activeSess = activeSessions?.filter((s: any) => s.status === 'active')?.length || 0;
  const suspiciousCount = suspiciousEvents?.length || 0;
  const averageTrustScore = trustScores?.length > 0 
    ? Math.round(trustScores.reduce((acc: number, t: any) => acc + (t.trust_score || 0), 0) / trustScores.length)
    : null;

  const hasData = totalSessions > 0 || (auditLogs && auditLogs.length > 0);

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativa</Badge>;
      case 'expired':
        return <Badge className="bg-muted text-muted-foreground">Expirada</Badge>;
      case 'revoked':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Revogada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getThreatColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-red-500/20">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Segurança & Compliance</h3>
          <p className="text-sm text-muted-foreground">Sessões, dispositivos, logs e threat score</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Resumo de Segurança */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Sessões Ativas</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeSess}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-muted-foreground">Trust Score</span>
            </div>
            <p className={`text-2xl font-bold ${getThreatColor(averageTrustScore)}`}>
              {averageTrustScore !== null ? `${averageTrustScore}%` : '--'}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-muted-foreground">Eventos Suspeitos</span>
            </div>
            <p className={`text-2xl font-bold ${suspiciousCount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {suspiciousCount}
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-muted-foreground">Logs Auditoria</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{auditLogs?.length || 0}</p>
          </div>
        </div>

        {/* Último Login */}
        {profile?.last_login_at && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Último Login:</span>
              <span className="text-sm font-medium text-foreground">
                {format(new Date(profile.last_login_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
        )}

        {/* Sessões Ativas */}
        {activeSessions && activeSessions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-400" />
              Sessões ({totalSessions})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeSessions.map((session: any) => (
                <div 
                  key={session.id}
                  className="p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {session.device_name || session.device_type || 'Dispositivo'}
                      </span>
                      {session.is_current && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                    {getSessionStatusBadge(session.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>IP: {session.ip_address || 'N/A'}</span>
                    <span>Local: {session.city || 'N/A'}, {session.country_code || 'N/A'}</span>
                    <span>Última atividade: {format(new Date(session.last_activity_at), "dd/MM HH:mm")}</span>
                    {session.risk_score !== null && (
                      <span className={session.risk_score > 50 ? 'text-red-400' : 'text-green-400'}>
                        Risk: {session.risk_score}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eventos Suspeitos */}
        {suspiciousEvents && suspiciousEvents.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              Eventos Suspeitos
            </h4>
            <div className="space-y-2">
              {suspiciousEvents.slice(0, 5).map((event: any) => (
                <div 
                  key={event.id}
                  className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
                >
                  <p className="text-sm font-medium text-orange-400">{event.event_type}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LGPD / Compliance */}
        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-400" />
            Compliance LGPD
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-muted-foreground">Termos de Uso</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-muted-foreground">Política de Privacidade</span>
            </div>
          </div>
        </div>
      </div>
    </FuturisticCard>
  );
}
