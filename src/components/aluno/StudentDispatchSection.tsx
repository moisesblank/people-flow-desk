// ============================================
// STUDENT DISPATCH SECTION — PERFIL DO ALUNO
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// State Machine: NOT_SENT → SENT_CONFIRMED → SEEN_BY_STUDENT
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Package,
  Truck,
  ExternalLink,
  Copy,
  CheckCircle2,
  Bell,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Dispatch {
  id: string;
  codigo_rastreio: string;
  servico_correios: string | null;
  data_postagem: string | null;
  dispatch_state: 'not_sent' | 'sent_confirmed' | 'seen_by_student';
  student_seen_at: string | null;
  descricao_conteudo: string | null;
  created_at: string;
}

const TRACKING_URL = (code: string) => 
  `https://rastreamento.correios.com.br/app/index.php?objetos=${code}`;

export function StudentDispatchSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Buscar o aluno_id real via RPC (match por email)
  const { data: studentData } = useQuery({
    queryKey: ['student-address-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_student_address_by_auth');
      if (error) {
        console.error('[StudentDispatch] Error fetching student data:', error);
        return null;
      }
      return data?.[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const realAlunoId = studentData?.aluno_id;

  // Buscar envios do aluno logado
  // RLS garante que o usuário só vê seus próprios envios (via email match)
  const { data: dispatches, isLoading } = useQuery({
    queryKey: ['student-dispatches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // RLS policy is_envio_owner() faz o match por email automaticamente
      const { data, error } = await supabase
        .from('envios_correios')
        .select('id, codigo_rastreio, servico_correios, data_postagem, dispatch_state, student_seen_at, descricao_conteudo, created_at')
        .eq('dispatch_state', 'sent_confirmed')
        .not('codigo_rastreio', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Dispatch[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Buscar envios já vistos também
  // RLS garante isolamento por usuário automaticamente
  const { data: seenDispatches } = useQuery({
    queryKey: ['student-seen-dispatches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('envios_correios')
        .select('id, codigo_rastreio, servico_correios, data_postagem, dispatch_state, student_seen_at, descricao_conteudo, created_at')
        .eq('dispatch_state', 'seen_by_student')
        .not('codigo_rastreio', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []) as Dispatch[];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  // Realtime: escutar novos envios (usando aluno_id real)
  useEffect(() => {
    if (!realAlunoId) return;

    const channel = supabase
      .channel(`student-dispatches-${realAlunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'envios_correios',
          filter: `aluno_id=eq.${realAlunoId}`,
        },
        (payload) => {
          console.log('[StudentDispatch] Realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['student-dispatches', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['student-seen-dispatches', user?.id] });
          
          // Se for um novo envio confirmado, mostrar toast
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            if (newData.dispatch_state === 'sent_confirmed' && newData.codigo_rastreio) {
              toast.info('📦 Novo material enviado!', {
                description: 'Clique para ver os detalhes do rastreamento.',
                duration: 10000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realAlunoId, user?.id, queryClient]);

  // Marcar como visto
  const markAsSeen = useCallback(async (envioId: string, via: 'tracking_click' | 'code_copy') => {
    try {
      const { data, error } = await supabase.rpc('mark_dispatch_seen', {
        p_envio_id: envioId,
        p_seen_via: via,
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['student-dispatches', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['student-seen-dispatches', user?.id] });
    } catch (err) {
      console.error('[StudentDispatch] Error marking as seen:', err);
    }
  }, [queryClient, user?.id]);

  // Abrir rastreamento
  const handleTrackingClick = useCallback((dispatch: Dispatch) => {
    window.open(TRACKING_URL(dispatch.codigo_rastreio), '_blank');
    markAsSeen(dispatch.id, 'tracking_click');
  }, [markAsSeen]);

  // Copiar código
  const handleCopyCode = useCallback(async (dispatch: Dispatch) => {
    try {
      await navigator.clipboard.writeText(dispatch.codigo_rastreio);
      setCopiedCode(dispatch.codigo_rastreio);
      toast.success('Código copiado com sucesso!');
      markAsSeen(dispatch.id, 'code_copy');
      
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error('Erro ao copiar código');
    }
  }, [markAsSeen]);

  // Se não tem envios pendentes, não renderizar nada (ou mostrar histórico)
  const hasActiveDispatches = dispatches && dispatches.length > 0;
  const hasSeenDispatches = seenDispatches && seenDispatches.length > 0;
  
  if (!hasActiveDispatches && !hasSeenDispatches && !isLoading) {
    return null; // Não renderiza seção se não há envios
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Envios pendentes de visualização (piscando) */}
      <AnimatePresence>
        {hasActiveDispatches && (
          <Card className="border-primary/50 shadow-lg relative overflow-hidden">
            {/* Efeito piscante */}
            <motion.div
              className="absolute inset-0 bg-primary/10 pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Package className="h-5 w-5 text-primary" />
                </motion.div>
                📦 Material Enviado!
                <Badge variant="default" className="ml-auto animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  Novo
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-4">
              {dispatches?.map((dispatch) => (
                <motion.div
                  key={dispatch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl bg-card border border-border/50"
                >
                  <p className="text-sm text-muted-foreground mb-3">
                    Seu material foi enviado! Acompanhe o rastreamento:
                  </p>
                  
                  {/* Código de rastreamento */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                    <Truck className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Código de Rastreio</p>
                      <p className="font-mono font-bold text-lg">{dispatch.codigo_rastreio}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(dispatch)}
                      className="gap-2"
                    >
                      {copiedCode === dispatch.codigo_rastreio ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Botão de rastreamento */}
                  <Button
                    onClick={() => handleTrackingClick(dispatch)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Acompanhar Entrega
                  </Button>
                  
                  {/* Info adicional */}
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>{dispatch.servico_correios || 'Correios'}</span>
                    {dispatch.data_postagem && (
                      <span>
                        Postado em {new Date(dispatch.data_postagem).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}
      </AnimatePresence>

      {/* Histórico de envios já vistos */}
      {hasSeenDispatches && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              Envios Anteriores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {seenDispatches?.map((dispatch) => (
              <div
                key={dispatch.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{dispatch.codigo_rastreio}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCode(dispatch)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(TRACKING_URL(dispatch.codigo_rastreio), '_blank')}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <Skeleton className="h-32 w-full rounded-xl" />
      )}
    </motion.div>
  );
}
