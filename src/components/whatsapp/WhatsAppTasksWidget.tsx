// ==============================================================================
// WIDGET DE TAREFAS DO WHATSAPP
// Mostra tarefas criadas via WhatsApp em outras páginas
// ==============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MessageSquare, CheckCircle2, Clock, AlertTriangle, 
  ExternalLink, MoreHorizontal, Trash2
} from 'lucide-react';
import { 
  useWhatsAppTasks, 
  useUpdateWhatsAppTask, 
  useDeleteWhatsAppTask 
} from '@/hooks/useWhatsAppData';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

interface WhatsAppTasksWidgetProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function WhatsAppTasksWidget({ 
  limit = 5, 
  showHeader = true,
  compact = false 
}: WhatsAppTasksWidgetProps) {
  const { data: tasks = [], isLoading } = useWhatsAppTasks();
  const updateTask = useUpdateWhatsAppTask();
  const deleteTask = useDeleteWhatsAppTask();
  
  const pendingTasks = tasks
    .filter(t => t.status !== 'done')
    .slice(0, limit);
  
  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await updateTask.mutateAsync({ 
      id: taskId, 
      updates: { status: newStatus } 
    });
    toast.success(newStatus === 'done' ? 'Tarefa concluída!' : 'Tarefa reaberta');
  };
  
  const handleDelete = async (taskId: string) => {
    await deleteTask.mutateAsync(taskId);
    toast.success('Tarefa removida');
  };
  
  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      high: { label: 'Alta', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
      med: { label: 'Média', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      low: { label: 'Baixa', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    };
    return config[priority] || config.med;
  };
  
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (pendingTasks.length === 0) {
    return (
      <Card className="glass-card">
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              Tarefas do WhatsApp
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground text-sm py-4">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
            Nenhuma tarefa pendente
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="glass-card border-green-500/20">
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              Tarefas via WhatsApp
              <Badge variant="secondary" className="text-xs">
                {pendingTasks.length}
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/central-whatsapp">
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver todas
              </Link>
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-2" : "p-4"}>
        <ScrollArea className={compact ? "h-[150px]" : "h-[200px]"}>
          <AnimatePresence>
            {pendingTasks.map((task, index) => {
              const priority = getPriorityBadge(task.priority);
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group ${
                    isOverdue ? 'bg-red-500/5' : ''
                  }`}
                >
                  <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={() => handleToggleComplete(task.id, task.status)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      task.status === 'done' ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${priority.className}`}>
                        {priority.label}
                      </Badge>
                      {task.due_date && (
                        <span className={`text-[10px] flex items-center gap-1 ${
                          isOverdue ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {format(new Date(task.due_date), 'dd/MM', { locale: ptBR })}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(task.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(task.id)}>
                        <Trash2 className="h-3 w-3 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
