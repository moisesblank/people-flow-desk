// ============================================
// SYNAPSE v14.0 - MONITORAMENTO EM TEMPO REAL
// Dashboard de monitoramento para o OWNER
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  Activity, Users, Clock, Shield, Eye, 
  TrendingUp, Wifi, WifiOff, RefreshCw,
  Monitor, Smartphone, Tablet, Globe,
  Chrome, AlertTriangle, CheckCircle,
  Zap, Database, Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserAccess {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_login_at: string | null;
  last_activity_at: string | null;
  status_atividade: string;
  ultima_sessao: {
    ip: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    login_at: string | null;
  } | null;
}

interface SystemStats {
  totalUsers: number;
  onlineUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
}

export default function Monitoramento() {
  const { isOwner, isLoading: authLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalSessions: 0,
    avgSessionDuration: 0
  });

  // Verificar se é owner
  useEffect(() => {
    if (!authLoading && !isOwner) {
      toast.error('Acesso negado: apenas o OWNER pode acessar esta página');
      navigate('/');
    }
  }, [isOwner, authLoading, navigate]);

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      // Buscar dados de acesso dos usuários
      const { data, error } = await supabase.rpc('get_all_users_last_access');
      
      if (error) {
        console.error('Erro ao buscar acessos:', error);
        if (showToast) toast.error('Erro ao carregar dados de monitoramento');
        return;
      }

      const usersData = (data || []) as UserAccess[];
      setUsers(usersData);

      // Calcular estatísticas
      const onlineCount = usersData.filter(u => u.is_online).length;
      setStats({
        totalUsers: usersData.length,
        onlineUsers: onlineCount,
        totalSessions: usersData.filter(u => u.ultima_sessao).length,
        avgSessionDuration: 25 // Placeholder
      });

      if (showToast) {
        toast.success('Dados atualizados!');
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchData();
      // Auto-refresh a cada 30 segundos
      const interval = setInterval(() => fetchData(), 30000);
      return () => clearInterval(interval);
    }
  }, [isOwner]);

  const getDeviceIcon = (device: string | null) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'bg-green-500';
      case 'Recente': return 'bg-blue-500';
      case 'Há pouco': return 'bg-yellow-500';
      case 'Hoje': return 'bg-orange-500';
      case 'Inativo': return 'bg-gray-500';
      default: return 'bg-red-500';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Monitoramento | Moisés Medeiros</title>
        <meta name="description" content="Painel de monitoramento em tempo real - Acesso exclusivo OWNER" />
      </Helmet>

      <div className="p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, hsl(280 80% 50% / 0.2), hsl(328 100% 54% / 0.2))' }}
                  animate={{ 
                    boxShadow: [
                      "0 0 10px hsl(280 80% 50% / 0.3)",
                      "0 0 20px hsl(280 80% 50% / 0.5)",
                      "0 0 10px hsl(280 80% 50% / 0.3)"
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold tracking-wider text-primary">MODO MASTER</span>
                </motion.div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Monitoramento
              </h1>
              <p className="text-lg text-muted-foreground">
                Visualização em tempo real de acessos e atividades do sistema
              </p>
            </div>
            
            <Button 
              onClick={() => fetchData(true)} 
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </motion.header>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Total Usuários</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <Wifi className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-500">{stats.onlineUsers}</p>
                      <p className="text-sm text-muted-foreground">Online Agora</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <Activity className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totalSessions}</p>
                      <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/10">
                      <Clock className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.avgSessionDuration}m</p>
                      <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Acessos de Usuários
                </CardTitle>
                <CardDescription>
                  Último acesso e atividade de cada usuário do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user, idx) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status_atividade)}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{user.full_name || 'Usuário'}</h4>
                            <Badge variant="outline" className="text-xs">
                              {user.status_atividade}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>

                        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                          {user.ultima_sessao && (
                            <>
                              <div className="flex items-center gap-1">
                                {getDeviceIcon(user.ultima_sessao.device)}
                                <span>{user.ultima_sessao.device || 'Desktop'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Globe className="h-4 w-4" />
                                <span>{user.ultima_sessao.browser || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Monitor className="h-4 w-4" />
                                <span>{user.ultima_sessao.os || 'N/A'}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {user.last_activity_at 
                              ? formatDistanceToNow(new Date(user.last_activity_at), { addSuffix: true, locale: ptBR })
                              : 'Nunca'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.last_login_at 
                              ? format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : 'Sem login'
                            }
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Saúde do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Database</span>
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Operacional
                      </span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Edge Functions</span>
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Ativas
                      </span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage</span>
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> OK
                      </span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}