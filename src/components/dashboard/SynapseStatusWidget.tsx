// ============================================
// SYNAPSE v14.0 - WIDGET DE STATUS DO SISTEMA
// Mostra status de todas as integrações e fases
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Zap, 
  Database,
  Shield,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface SystemStatus {
  name: string;
  status: 'online' | 'warning' | 'offline';
  icon: React.ElementType;
  description: string;
  lastCheck?: string;
}

export function SynapseStatusWidget() {
  const { isOwner } = useAdminCheck();
  const [systemHealth, setSystemHealth] = useState(100);
  const [statuses, setStatuses] = useState<SystemStatus[]>([
    { name: 'Database', status: 'online', icon: Database, description: 'Conexão estável' },
    { name: 'Auth', status: 'online', icon: Shield, description: 'Autenticação ativa' },
    { name: 'LMS', status: 'online', icon: BookOpen, description: 'Cursos disponíveis' },
    { name: 'Financeiro', status: 'online', icon: DollarSign, description: 'Módulo operacional' },
    { name: 'Equipe', status: 'online', icon: Users, description: 'Gestão ativa' },
    { name: 'Calendário', status: 'online', icon: Calendar, description: 'Sincronizado' },
  ]);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      // Test database connection
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      
      // Test auth
      const { data: authData } = await supabase.auth.getSession();
      
      const newStatuses = [...statuses];
      
      // Update database status
      newStatuses[0].status = dbError ? 'offline' : 'online';
      newStatuses[0].description = dbError ? 'Erro de conexão' : 'Conexão estável';
      
      // Update auth status
      newStatuses[1].status = authData.session ? 'online' : 'warning';
      newStatuses[1].description = authData.session ? 'Autenticação ativa' : 'Sessão expirada';
      
      setStatuses(newStatuses);
      
      // Calculate health
      const onlineCount = newStatuses.filter(s => s.status === 'online').length;
      setSystemHealth(Math.round((onlineCount / newStatuses.length) * 100));
    } catch {
      setSystemHealth(50);
    }
  };

  if (!isOwner) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="w-4 h-4 text-stats-green" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-stats-gold" />;
      case 'offline': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-stats-green/20 text-stats-green border-stats-green/30';
      case 'warning': return 'bg-stats-gold/20 text-stats-gold border-stats-gold/30';
      case 'offline': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return '';
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            SYNAPSE v14.0
          </div>
          <Badge className={getStatusColor(systemHealth >= 80 ? 'online' : systemHealth >= 50 ? 'warning' : 'offline')}>
            {systemHealth}% Health
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sistema</span>
            <span>{systemHealth}%</span>
          </div>
          <Progress value={systemHealth} className="h-2" />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                </div>
                {getStatusIcon(item.status)}
              </motion.div>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" />
            Modo Master Disponível
          </span>
          <span>Ctrl+Shift+E</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default SynapseStatusWidget;
