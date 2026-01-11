// ============================================
// SYNAPSE v14.1 - DASHBOARD DE ATIVIDADE DE USUÁRIOS
// 🚀 PATCH 5K: Virtualização para 5.000+ usuários
// Visível APENAS para o OWNER (moisesblank@gmail.com)
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Users, Wifi, WifiOff, Clock, RefreshCw, Monitor, Smartphone, Tablet, Activity, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

// ============================================
// TIPOS
// ============================================
interface UserActivity {
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
    device: string;
    browser: string;
    os: string;
    login_at: string;
  } | null;
}

// ============================================
// CONSTANTES DE VIRTUALIZAÇÃO
// ============================================
const ROW_HEIGHT = 72; // Altura de cada linha em pixels
const VISIBLE_ROWS = 8; // Número de linhas visíveis
const BUFFER_ROWS = 3; // Buffer para scroll suave

// ============================================
// HELPERS
// ============================================
function getDeviceIcon(device: string | undefined) {
  if (!device) return <Monitor className="w-4 h-4" />;
  if (device === 'mobile') return <Smartphone className="w-4 h-4" />;
  if (device === 'tablet') return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Online': return 'bg-green-500 text-white';
    case 'Recente': return 'bg-emerald-500/80 text-white';
    case 'Há pouco': return 'bg-yellow-500 text-black';
    case 'Hoje': return 'bg-orange-500 text-white';
    case 'Inativo': return 'bg-gray-500 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
}

// ============================================
// COMPONENTE DE LINHA (Memoizado)
// ============================================
const UserRow = ({ user }: { user: UserActivity }) => (
  <TableRow className="border-b border-border/50 hover:bg-muted/30">
    <TableCell>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="bg-primary/20 text-primary font-medium">
              {user.full_name?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {user.is_online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        <div>
          <p className="font-medium">{user.full_name || 'Sem nome'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <Badge className={getStatusColor(user.status_atividade)}>
        {user.is_online && <Wifi className="w-3 h-3 mr-1" />}
        {!user.is_online && user.status_atividade !== 'Nunca acessou' && <WifiOff className="w-3 h-3 mr-1" />}
        {user.status_atividade}
      </Badge>
    </TableCell>
    <TableCell className="text-sm">
      {user.last_login_at ? (
        <span title={new Date(user.last_login_at).toLocaleString('pt-BR')}>
          {formatDistanceToNow(new Date(user.last_login_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </span>
      ) : (
        <span className="text-muted-foreground">Nunca</span>
      )}
    </TableCell>
    <TableCell className="text-sm">
      {user.last_activity_at ? (
        <span title={new Date(user.last_activity_at).toLocaleString('pt-BR')}>
          {formatDistanceToNow(new Date(user.last_activity_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </TableCell>
    <TableCell>
      {user.ultima_sessao ? (
        <div className="flex items-center gap-2 text-sm">
          {getDeviceIcon(user.ultima_sessao.device)}
          <div className="flex flex-col">
            <span>{user.ultima_sessao.browser}</span>
            <span className="text-xs text-muted-foreground">{user.ultima_sessao.os}</span>
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      )}
    </TableCell>
  </TableRow>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function UserActivityDashboard() {
  const { isOwner, isLoading: checkingOwner } = useAdminCheck();
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, online: 0, activeToday: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🚀 PATCH 5K: Estado de virtualização
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    if (!isOwner) return;
    
    try {
      const { data, error } = await supabase.rpc('get_all_users_last_access');
      
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }
      
      if (data) {
        setUsers(data as UserActivity[]);
        const onlineCount = data.filter((u: UserActivity) => u.is_online).length;
        const todayCount = data.filter((u: UserActivity) => 
          ['Online', 'Recente', 'Há pouco', 'Hoje'].includes(u.status_atividade)
        ).length;
        setStats({
          total: data.length,
          online: onlineCount,
          activeToday: todayCount
        });
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isOwner]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
  };

  // PATCH-030: jitter anti-herd (0-5s)
  useEffect(() => {
    if (isOwner) {
      fetchUsers();
      const jitter = Math.floor(Math.random() * 5000);
      const interval = setInterval(fetchUsers, 30000 + jitter);
      return () => clearInterval(interval);
    }
  }, [isOwner, fetchUsers]);

  // 🚀 PATCH 5K: Filtro com memoização
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.full_name?.toLowerCase().includes(term) || 
      u.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // 🚀 PATCH 5K: Cálculo de virtualização
  const virtualizedData = useMemo(() => {
    const totalHeight = filteredUsers.length * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
    const endIndex = Math.min(
      filteredUsers.length,
      Math.ceil((scrollTop + VISIBLE_ROWS * ROW_HEIGHT) / ROW_HEIGHT) + BUFFER_ROWS
    );
    const visibleUsers = filteredUsers.slice(startIndex, endIndex);
    const offsetY = startIndex * ROW_HEIGHT;

    return { totalHeight, visibleUsers, offsetY, startIndex, endIndex };
  }, [filteredUsers, scrollTop]);

  // Handler de scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Se não for owner, não renderizar nada
  if (checkingOwner) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            Monitoramento de Usuários
          </h2>
          <p className="text-muted-foreground text-sm">
            Visão em tempo real de todos os usuários do sistema
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total de Usuários</p>
                <p className="text-3xl font-bold mt-1">{stats.total.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Online Agora</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{stats.online.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <Wifi className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Ativos Hoje</p>
                <p className="text-3xl font-bold text-blue-500 mt-1">{stats.activeToday.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Último Acesso dos Usuários
              </CardTitle>
              <CardDescription>
                {/* 🚀 PATCH 5K: Indicador de virtualização */}
                Mostrando {virtualizedData.visibleUsers.length} de {filteredUsers.length} usuários (virtualizado)
              </CardDescription>
            </div>
            {/* 🚀 PATCH 5K: Campo de busca */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* 🚀 PATCH 5K: Container virtualizado */}
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-[500px] overflow-auto"
                style={{ willChange: 'scroll-position' }}
              >
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px]">Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead>Dispositivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Spacer superior para manter posição de scroll */}
                    {virtualizedData.offsetY > 0 && (
                      <tr style={{ height: virtualizedData.offsetY }}>
                        <td colSpan={5} />
                      </tr>
                    )}
                    
                    {/* Linhas visíveis (virtualizadas) */}
                    {virtualizedData.visibleUsers.map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
                    
                    {/* Spacer inferior para manter altura total */}
                    {virtualizedData.totalHeight - virtualizedData.offsetY - (virtualizedData.visibleUsers.length * ROW_HEIGHT) > 0 && (
                      <tr style={{ 
                        height: virtualizedData.totalHeight - virtualizedData.offsetY - (virtualizedData.visibleUsers.length * ROW_HEIGHT) 
                      }}>
                        <td colSpan={5} />
                      </tr>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Info de performance */}
              <div className="mt-2 text-xs text-muted-foreground text-right">
                🚀 Virtualização ativa: ~{VISIBLE_ROWS + BUFFER_ROWS * 2} elementos no DOM (de {filteredUsers.length} total)
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default UserActivityDashboard;
