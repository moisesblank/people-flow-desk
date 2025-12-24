// ============================================
// 🏛️ LEI III + LEI VI: GERENCIADOR DE DISPOSITIVOS CONFIÁVEIS
// UI para gerenciar dispositivos e ver trust scores
// ============================================

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Trash2, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Loader2,
  Star,
  StarOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TrustedDevice {
  id: string;
  device_hash: string;
  device_name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  trust_score: number | null;
  risk_score: number | null;
  is_trusted: boolean | null;
  is_blocked: boolean | null;
  blocked_reason: string | null;
  total_sessions: number | null;
  suspicious_events: number | null;
  successful_logins: number | null;
  failed_logins: number | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  last_login_at: string | null;
  last_country: string | null;
  last_city: string | null;
  last_ip: string | null;
}

interface TrustedDevicesManagerProps {
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

function TrustedDevicesManagerComponent({ 
  className = '', 
  showTitle = true,
  compact = false 
}: TrustedDevicesManagerProps) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceToRemove, setDeviceToRemove] = useState<TrustedDevice | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Buscar dispositivos do usuário
  const fetchDevices = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('device_trust_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      console.error('[TrustedDevices] Erro ao buscar dispositivos:', err);
      toast.error('Erro ao carregar dispositivos');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Remover dispositivo
  const handleRemoveDevice = async () => {
    if (!deviceToRemove || !user?.id) return;

    try {
      setIsRemoving(true);
      
      // Remover da tabela de trust
      const { error } = await supabase
        .from('device_trust_scores')
        .delete()
        .eq('id', deviceToRemove.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Atualizar lista local
      setDevices(prev => prev.filter(d => d.id !== deviceToRemove.id));
      toast.success('Dispositivo removido com sucesso');
      setDeviceToRemove(null);
    } catch (err) {
      console.error('[TrustedDevices] Erro ao remover:', err);
      toast.error('Erro ao remover dispositivo');
    } finally {
      setIsRemoving(false);
    }
  };

  // Ícone do dispositivo
  const getDeviceIcon = (type: string | null) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  // Cor do trust score
  const getTrustScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Badge de status
  const getTrustBadge = (device: TrustedDevice) => {
    if (device.is_blocked) {
      return (
        <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Bloqueado
        </Badge>
      );
    }
    if (device.is_trusted) {
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Confiável
        </Badge>
      );
    }
    if ((device.suspicious_events || 0) > 3) {
      return (
        <Badge variant="destructive" className="bg-orange-500/20 text-orange-500 border-orange-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Suspeito
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
        <Shield className="w-3 h-3 mr-1" />
        Em análise
      </Badge>
    );
  };

  // Formatar data
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Desconhecido';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Dispositivos Confiáveis
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Dispositivos Confiáveis
                </CardTitle>
                <CardDescription>
                  Gerencie os dispositivos autorizados a acessar sua conta
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDevices}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
        )}

        <CardContent className={compact ? 'p-4' : ''}>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum dispositivo registrado</p>
              <p className="text-sm">Dispositivos serão registrados automaticamente ao fazer login</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{devices.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {devices.filter(d => d.is_trusted).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confiáveis</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {devices.filter(d => (d.suspicious_events || 0) > 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Com alertas</p>
                </div>
              </div>

              <Separator />

              {/* Lista de dispositivos */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {devices.map((device, index) => (
                    <motion.div
                      key={device.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 border rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Ícone */}
                        <div className={`p-3 rounded-lg ${
                          device.is_trusted 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {getDeviceIcon(device.device_type)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {device.device_name || `${device.browser} - ${device.os}`}
                            </span>
                            {getTrustBadge(device)}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {device.browser || 'Browser'} / {device.os || 'OS'}
                            </span>
                            {device.last_country && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {device.last_country}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(device.last_seen_at)}
                            </span>
                          </div>

                          {/* Trust Score Bar */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-20">Trust Score:</span>
                            <Progress 
                              value={device.trust_score || 0} 
                              className="h-2 flex-1 max-w-32"
                            />
                            <span className={`text-sm font-semibold ${getTrustScoreColor(device.trust_score)}`}>
                              {device.trust_score || 0}%
                            </span>
                            {device.is_trusted && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          </div>

                          {/* Stats */}
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              {device.total_sessions || 0} sessões
                            </span>
                            {(device.suspicious_events || 0) > 0 && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <AlertTriangle className="w-3 h-3" />
                                {device.suspicious_events} alertas
                              </span>
                            )}
                            <span className="text-muted-foreground/60">
                              Desde {formatDate(device.first_seen_at)}
                            </span>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeviceToRemove(device)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <AlertDialog open={!!deviceToRemove} onOpenChange={() => setDeviceToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Remover Dispositivo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deviceToRemove?.device_name || 'este dispositivo'}</strong>?
              <br /><br />
              O dispositivo perderá o status de confiança e precisará ser validado novamente no próximo login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveDevice}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const TrustedDevicesManager = memo(TrustedDevicesManagerComponent);
