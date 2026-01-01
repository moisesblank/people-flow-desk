// ============================================
// GESTÃO LOGS v1.0
// Visualização em tempo real de todos os logs do sistema
// REGRA PERMANENTE: Todo erro deve ser visível ao owner
// ============================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Zap,
  RefreshCw,
  Filter,
  Clock,
  Globe,
  User,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemLogs, SystemLog, LogSeverity } from '@/hooks/useSystemLogs';

// Configurações visuais por severidade
const SEVERITY_CONFIG: Record<LogSeverity, { 
  icon: typeof Info; 
  color: string; 
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Info',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Aviso',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Erro',
  },
  critical: {
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Crítico',
  },
};

// Componente de Log Individual
function LogEntry({ log }: { log: SystemLog }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = SEVERITY_CONFIG[log.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`border rounded-lg ${config.borderColor} ${config.bgColor} p-3 mb-2`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {log.category}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(log.timestamp), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
            
            <p className="text-sm font-medium mt-1 break-words">
              {log.error_message}
            </p>
            
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {log.affected_url && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {log.affected_url}
                </span>
              )}
              {log.user_email && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {log.user_email}
                </span>
              )}
              <span className="text-[10px] opacity-50">
                {log.source}
              </span>
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            {log.stack_trace && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Stack Trace:</p>
                <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
                  {log.stack_trace}
                </pre>
              </div>
            )}
            
            {log.triggered_action && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Ação:</span>
                <span>{log.triggered_action}</span>
              </div>
            )}
            
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Metadata:</p>
                <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <span>ID: {log.id.slice(0, 8)}</span>
              <span>Session: {log.session_id?.slice(0, 8) || 'N/A'}</span>
              {log.user_role && <span>Role: {log.user_role}</span>}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

// Componente de Estatísticas
function StatsCards({ stats }: { stats: ReturnType<typeof useSystemLogs>['stats'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      <Card className="bg-card/50">
        <CardContent className="p-3">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-blue-500">{stats.info}</div>
          <div className="text-xs text-muted-foreground">Info</div>
        </CardContent>
      </Card>
      
      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-yellow-500">{stats.warning}</div>
          <div className="text-xs text-muted-foreground">Avisos</div>
        </CardContent>
      </Card>
      
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-red-500">{stats.error}</div>
          <div className="text-xs text-muted-foreground">Erros</div>
        </CardContent>
      </Card>
      
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-purple-500">{stats.critical}</div>
          <div className="text-xs text-muted-foreground">Críticos</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Página Principal
export default function GestaoLogs() {
  const { logs, isLoading, error, stats, refetch, clearLogs } = useSystemLogs(200);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<LogSeverity | 'all'>('all');

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.affected_url?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
      
      return matchesSearch && matchesSeverity;
    });
  }, [logs, searchTerm, selectedSeverity]);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Logs do Sistema
            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento em tempo real de todos os erros e eventos do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por mensagem, categoria ou URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Tabs 
              value={selectedSeverity} 
              onValueChange={(v) => setSelectedSeverity(v as LogSeverity | 'all')}
            >
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="critical" className="text-purple-500">Crítico</TabsTrigger>
                <TabsTrigger value="error" className="text-red-500">Erro</TabsTrigger>
                <TabsTrigger value="warning" className="text-yellow-500">Aviso</TabsTrigger>
                <TabsTrigger value="info" className="text-blue-500">Info</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar logs: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Eventos ({filteredLogs.length})</span>
            {filteredLogs.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                Último: {formatDistanceToNow(new Date(filteredLogs[0]?.timestamp || Date.now()), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum log encontrado</p>
                <p className="text-xs mt-1">
                  {searchTerm || selectedSeverity !== 'all' 
                    ? 'Tente ajustar os filtros' 
                    : 'Os logs aparecerão aqui em tempo real'}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>
          🔴 Todos os erros do sistema são registrados automaticamente e exibidos em tempo real.
        </p>
        <p className="mt-1">
          Esta funcionalidade é uma <strong>REGRA PERMANENTE</strong> do sistema.
        </p>
      </div>
    </div>
  );
}
