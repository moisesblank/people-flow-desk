// ============================================
// MARKETING ALERTS WIDGET
// Painel de alertas inteligentes em tempo real
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Zap
} from 'lucide-react';
import { useMarketingAutomations, MarketingAlert } from '@/hooks/useMarketingAutomations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getAlertIcon = (tipo: string) => {
  switch (tipo) {
    case 'novo_lead': return Users;
    case 'cac_alto': return TrendingDown;
    case 'roi_baixo': return TrendingDown;
    case 'meta_atingida': return TrendingUp;
    case 'conversao': return Target;
    case 'leads_frios': return AlertTriangle;
    default: return Info;
  }
};

const getSeverityColor = (severidade: string) => {
  switch (severidade) {
    case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'success': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  }
};

const getSeverityBadge = (severidade: string) => {
  switch (severidade) {
    case 'error': return { label: 'Crítico', variant: 'destructive' as const };
    case 'warning': return { label: 'Atenção', variant: 'secondary' as const };
    case 'success': return { label: 'Sucesso', variant: 'default' as const };
    default: return { label: 'Info', variant: 'outline' as const };
  }
};

interface AlertItemProps {
  alert: MarketingAlert;
  onResolve: (id: string) => void;
  onMarkRead: (id: string) => void;
}

function AlertItem({ alert, onResolve, onMarkRead }: AlertItemProps) {
  const Icon = getAlertIcon(alert.tipo);
  const colorClass = getSeverityColor(alert.severidade);
  const badge = getSeverityBadge(alert.severidade);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 rounded-lg border ${colorClass} ${!alert.lido ? 'ring-2 ring-primary/30' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{alert.titulo}</h4>
            <Badge variant={badge.variant} className="text-[10px]">
              {badge.label}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {alert.mensagem}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(alert.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
            
            <div className="flex gap-1">
              {!alert.lido && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => onMarkRead(alert.id)}
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onResolve(alert.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function MarketingAlertsWidget() {
  const { 
    alerts, 
    alertsNaoLidos, 
    isLoading, 
    resolveAlert, 
    markAlertRead,
    checkAutomaticAlerts 
  } = useMarketingAutomations();

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            Alertas de Marketing
            {alertsNaoLidos > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {alertsNaoLidos}
              </Badge>
            )}
          </CardTitle>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={checkAutomaticAlerts}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Verificar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
                <h4 className="font-medium text-foreground">Tudo em ordem!</h4>
                <p className="text-sm text-muted-foreground">
                  Nenhum alerta pendente
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onResolve={resolveAlert}
                    onMarkRead={markAlertRead}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
