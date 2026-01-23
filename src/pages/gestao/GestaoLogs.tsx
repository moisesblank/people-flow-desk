// ============================================
// GESTÃO LOGS v2.0
// Visualização em tempo real de todos os logs do sistema
// REGRA PERMANENTE: Todo erro deve ser visível ao owner
// CLEANUP: Logs são aniquilados após 48 horas
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
  Clock,
  Globe,
  User,
  Search,
  X,
  Calendar,
  Terminal,
  Server,
  FileCode,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useSystemLogs, SystemLog, LogSeverity } from '@/hooks/useSystemLogs';
import { formatError } from '@/lib/utils/formatError';

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

// Formatar timestamp completo
function formatFullTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return format(date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
}

// Formatar timestamp curto para lista
function formatShortTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return format(date, "HH:mm:ss - dd/MM/yyyy", { locale: ptBR });
}

// Modal de Detalhes do Log
function LogDetailModal({ 
  log, 
  isOpen, 
  onClose 
}: { 
  log: SystemLog | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!log) return null;
  
  const config = SEVERITY_CONFIG[log.severity];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <span>Detalhes do Log</span>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Timestamp Principal */}
            <div className={`p-4 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`h-4 w-4 ${config.color}`} />
                <span className="text-sm font-medium">Data e Hora do Evento</span>
              </div>
              <p className="text-lg font-mono font-bold">{formatFullTimestamp(log.timestamp)}</p>
            </div>

            {/* Mensagem de Erro */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Mensagem
              </h4>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium break-words whitespace-pre-wrap">
                  {log.error_message}
                </p>
              </div>
            </div>

            <Separator />

            {/* Informações Gerais */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Categoria</h4>
                <Badge variant="secondary">{log.category}</Badge>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Fonte</h4>
                <Badge variant="outline">{log.source}</Badge>
              </div>
              {log.affected_url && (
                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    URL Afetada
                  </h4>
                  <p className="text-sm font-mono bg-muted/30 p-2 rounded break-all">
                    {log.affected_url}
                  </p>
                </div>
              )}
              {log.triggered_action && (
                <div className="col-span-2">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Ação Disparada</h4>
                  <p className="text-sm">{log.triggered_action}</p>
                </div>
              )}
            </div>

            {/* Stack Trace */}
            {log.stack_trace && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileCode className="h-4 w-4" />
                    Stack Trace
                  </h4>
                  <ScrollArea className="h-[200px]">
                    <pre className="text-xs bg-background border p-4 rounded-lg overflow-x-auto font-mono">
                      {log.stack_trace}
                    </pre>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Metadata
                  </h4>
                  <pre className="text-xs bg-background border p-4 rounded-lg overflow-x-auto font-mono">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}

            <Separator />

            {/* Informações do Usuário e Sistema */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {log.user_email && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Usuário
                  </h4>
                  <p className="text-sm font-mono">{log.user_email}</p>
                </div>
              )}
              {log.user_role && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Role</h4>
                  <Badge variant="secondary">{log.user_role}</Badge>
                </div>
              )}
              {log.session_id && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Session ID</h4>
                  <p className="text-xs font-mono">{log.session_id}</p>
                </div>
              )}
              {log.device_info && (
                <div className="col-span-2 md:col-span-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Dispositivo</h4>
                  <p className="text-xs font-mono">{log.device_info}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* IDs */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                ID: <span className="font-mono">{log.id}</span>
              </span>
              {log.ip_hash && (
                <span>IP Hash: <span className="font-mono">{log.ip_hash}</span></span>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Componente de Log Individual (clicável)
function LogEntry({ 
  log, 
  onClick 
}: { 
  log: SystemLog; 
  onClick: () => void;
}) {
  const config = SEVERITY_CONFIG[log.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onClick={onClick}
      className={`border rounded-lg ${config.borderColor} ${config.bgColor} p-3 mb-2 cursor-pointer hover:opacity-80 transition-opacity`}
    >
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
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" />
              {formatShortTimestamp(log.timestamp)}
            </span>
          </div>
          
          <p className="text-sm font-medium mt-1 break-words line-clamp-2">
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
      </div>
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
  const { logs, isLoading, error, stats, refetch } = useSystemLogs(200);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<LogSeverity | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Abrir modal com detalhes do log
  const handleLogClick = (log: SystemLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

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
              <span>Erro ao carregar logs: {formatError(error)}</span>
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
              <span className="text-xs font-normal text-muted-foreground font-mono">
                Último: {formatShortTimestamp(filteredLogs[0]?.timestamp || new Date().toISOString())}
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
                  <LogEntry 
                    key={log.id} 
                    log={log} 
                    onClick={() => handleLogClick(log)}
                  />
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>
          🔴 Todos os erros são registrados em tempo real e <strong>aniquilados automaticamente após 48 horas</strong>.
        </p>
        <p className="mt-1">
          Clique em qualquer log para ver detalhes completos.
        </p>
      </div>

      {/* Modal de Detalhes */}
      <LogDetailModal 
        log={selectedLog} 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}
