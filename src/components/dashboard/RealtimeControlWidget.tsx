// ============================================
// WIDGET DE CONTROLE EM TEMPO REAL
// Overview de anexos, checklists e status de IA
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Paperclip,
  CheckSquare,
  Brain,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  Sparkles,
  RefreshCw,
  Eye,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RealtimeStats {
  totalAttachments: number;
  pendingExtractions: number;
  completedExtractions: number;
  totalChecklists: number;
  pendingChecklist: number;
  completedChecklist: number;
  recentAttachments: any[];
  recentChecklist: any[];
}

export function RealtimeControlWidget({ className }: { className?: string }) {
  const { isAdminOrOwner, isOwner } = useAdminCheck();
  const [stats, setStats] = useState<RealtimeStats>({
    totalAttachments: 0,
    pendingExtractions: 0,
    completedExtractions: 0,
    totalChecklists: 0,
    pendingChecklist: 0,
    completedChecklist: 0,
    recentAttachments: [],
    recentChecklist: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Buscar estatísticas de anexos
      const { data: attachments, count: attachmentCount } = await supabase
        .from('universal_attachments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      const pendingExtractions = attachments?.filter(a => 
        a.extraction_status === 'pending' || a.extraction_status === 'processing'
      ).length || 0;

      const completedExtractions = attachments?.filter(a => 
        a.extraction_status === 'completed'
      ).length || 0;

      // Buscar estatísticas de checklists
      const { data: checklists, count: checklistCount } = await supabase
        .from('smart_checklists' as any)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      const pendingChecklist = (checklists || []).filter((c: any) => !c.completed).length;
      const completedChecklist = (checklists || []).filter((c: any) => c.completed).length;

      setStats({
        totalAttachments: attachmentCount || 0,
        pendingExtractions,
        completedExtractions,
        totalChecklists: checklistCount || 0,
        pendingChecklist,
        completedChecklist,
        recentAttachments: attachments || [],
        recentChecklist: checklists || [],
      });
    } catch (error) {
      console.error('Error fetching realtime stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOrOwner) {
      fetchStats();

      // Realtime subscription
      const channel = supabase
        .channel('realtime-control')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'universal_attachments' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'smart_checklists' }, fetchStats)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdminOrOwner]);

  if (!isAdminOrOwner) return null;

  const checklistProgress = stats.totalChecklists > 0
    ? Math.round((stats.completedChecklist / stats.totalChecklists) * 100)
    : 0;

  const extractionProgress = stats.totalAttachments > 0
    ? Math.round((stats.completedExtractions / stats.totalAttachments) * 100)
    : 0;

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Controle em Tempo Real</CardTitle>
              <p className="text-xs text-muted-foreground">
                Anexos, Checklists e IA
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStats}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* KPIs Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-secondary/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Paperclip className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Anexos</span>
            </div>
            <p className="text-xl font-bold">{stats.totalAttachments}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-secondary/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">IA Extraídos</span>
            </div>
            <p className="text-xl font-bold">{stats.completedExtractions}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-secondary/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Checklists</span>
            </div>
            <p className="text-xl font-bold">{stats.totalChecklists}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-secondary/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-xl font-bold">{stats.pendingChecklist + stats.pendingExtractions}</p>
          </motion.div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                Progresso Checklists
              </span>
              <span className="font-medium text-primary">{checklistProgress}%</span>
            </div>
            <Progress value={checklistProgress} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Extração IA
              </span>
              <span className="font-medium text-purple-500">{extractionProgress}%</span>
            </div>
            <Progress value={extractionProgress} className="h-2 [&>div]:bg-purple-500" />
          </div>
        </div>

        {/* Tabs de Detalhes */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="attachments" className="text-xs gap-1">
              <Paperclip className="h-3 w-3" />
              Recentes
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs gap-1">
              <CheckSquare className="h-3 w-3" />
              Pendentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attachments" className="mt-3">
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : stats.recentAttachments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Nenhum anexo recente</p>
                  </div>
                ) : (
                  stats.recentAttachments.slice(0, 5).map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <div className="p-1.5 rounded bg-blue-500/10">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.title || attachment.original_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.entity_type} • {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      {attachment.extraction_status === 'completed' && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          IA
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="checklist" className="mt-3">
            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : stats.recentChecklist.filter((c: any) => !c.completed).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Nenhum item pendente</p>
                  </div>
                ) : (
                  stats.recentChecklist
                    .filter((c: any) => !c.completed)
                    .slice(0, 5)
                    .map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className={cn(
                          "p-1.5 rounded",
                          item.priority === 'high' ? 'bg-red-500/10' :
                          item.priority === 'medium' ? 'bg-amber-500/10' :
                          'bg-emerald-500/10'
                        )}>
                          <CheckSquare className={cn(
                            "h-3.5 w-3.5",
                            item.priority === 'high' ? 'text-red-500' :
                            item.priority === 'medium' ? 'text-amber-500' :
                            'text-emerald-500'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.entity_type} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          item.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                          item.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        )}>
                          {item.priority === 'high' ? 'Urgente' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
