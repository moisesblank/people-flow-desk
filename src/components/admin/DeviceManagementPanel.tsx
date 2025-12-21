// ============================================
// 🛡️ DOGMA XI v2.0: Painel de Gestão de Dispositivos
// Monitoramento em tempo real para o OWNER
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Monitor, Smartphone, Tablet, RefreshCw, Search, Users, 
  Shield, AlertTriangle, Activity, Power, ChevronDown, 
  ChevronRight, Clock, Eye, XCircle, Wifi
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceData {
  id: string;
  user_id: string;
  user_email: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  is_active: boolean;
  is_trusted: boolean;
  first_seen_at: string;
  last_seen_at: string;
  deactivated_at: string | null;
  active_count: number;
}

interface BlockedAttempt {
  id: string;
  user_email: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  attempt_type: string;
  blocked: boolean;
  resolved: boolean;
  created_at: string;
}

interface DeviceStats {
  total_devices: number;
  active_devices: number;
  total_users: number;
  users_at_limit: number;
  recent_attempts: number;
  devices_by_type: Record<string, number>;
  online_now: number;
}

export function DeviceManagementPanel() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [blockedAttempts, setBlockedAttempts] = useState<BlockedAttempt[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('devices');

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_get_device_stats');
    if (!error && data) {
      setStats(data as unknown as DeviceStats);
    }
  }, []);

  // Buscar dispositivos
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_all_devices', {
        p_limit: 500,
        p_offset: 0,
        p_only_active: false
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        setDevices(result.devices || []);
      }
    } catch (err) {
      console.error('[ADMIN] Erro ao buscar dispositivos:', err);
      toast.error('Erro ao carregar dispositivos');
    }
    setIsLoading(false);
  }, []);

  // Buscar tentativas bloqueadas
  const fetchBlockedAttempts = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_get_blocked_attempts', {
      p_limit: 50,
      p_only_unresolved: false
    });

    if (!error && data) {
      const result = data as any;
      if (result.success) {
        setBlockedAttempts(result.attempts || []);
      }
    }
  }, []);

  // Carregar tudo inicialmente
  useEffect(() => {
    fetchDevices();
    fetchStats();
    fetchBlockedAttempts();

    // Realtime para dispositivos
    const deviceChannel = supabase
      .channel('device-management-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_devices'
      }, () => {
        fetchDevices();
        fetchStats();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'device_access_attempts'
      }, (payload) => {
        fetchBlockedAttempts();
        fetchStats();
        
        // Notificação de nova tentativa bloqueada
        const attempt = payload.new as any;
        toast.warning('Nova tentativa bloqueada', {
          description: `${attempt.device_name || 'Dispositivo'} - ${attempt.attempt_type}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(deviceChannel);
    };
  }, [fetchDevices, fetchStats, fetchBlockedAttempts]);

  // Desativar dispositivo
  const handleDeactivateDevice = async (deviceId: string, deviceName: string) => {
    try {
      const { data, error } = await supabase.rpc('deactivate_device', {
        p_device_id: deviceId
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast.success(`Dispositivo "${deviceName}" desativado`);
        fetchDevices();
        fetchStats();
      } else {
        toast.error(result.error || 'Erro ao desativar');
      }
    } catch (err) {
      console.error('[ADMIN] Erro:', err);
      toast.error('Erro ao desativar dispositivo');
    }
  };

  // Ícone do dispositivo
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // Formatar tempo
  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return 'Desconhecido';
    }
  };

  // Filtrar dispositivos
  const filteredDevices = devices.filter(d => 
    d.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.device_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por usuário
  const devicesByUser = filteredDevices.reduce((acc, d) => {
    if (!acc[d.user_id]) {
      acc[d.user_id] = {
        email: d.user_email,
        devices: [],
        activeCount: 0
      };
    }
    acc[d.user_id].devices.push(d);
    if (d.is_active) acc[d.user_id].activeCount++;
    return acc;
  }, {} as Record<string, { email: string; devices: DeviceData[]; activeCount: number }>);

  // Toggle expansão de usuário
  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Gestão de Dispositivos
          </h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real - DOGMA XI
          </p>
        </div>
        
        <Button onClick={() => { fetchDevices(); fetchStats(); fetchBlockedAttempts(); }} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_devices}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.active_devices}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-500">{stats.total_users}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-500">{stats.users_at_limit}</p>
                  <p className="text-xs text-muted-foreground">No Limite</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.recent_attempts}</p>
                  <p className="text-xs text-muted-foreground">Bloqueados 24h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{stats.online_now}</p>
                  <p className="text-xs text-muted-foreground">Online Agora</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  <span className="text-xs">{stats.devices_by_type?.desktop || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  <span className="text-xs">{stats.devices_by_type?.mobile || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tablet className="w-3 h-3" />
                  <span className="text-xs">{stats.devices_by_type?.tablet || 0}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Por Tipo</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="devices" className="gap-2">
            <Monitor className="w-4 h-4" />
            Dispositivos
          </TabsTrigger>
          <TabsTrigger value="attempts" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Tentativas Bloqueadas
            {blockedAttempts.filter(a => !a.resolved).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {blockedAttempts.filter(a => !a.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dispositivos */}
        <TabsContent value="devices" className="mt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou dispositivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de usuários e dispositivos */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {Object.entries(devicesByUser).map(([userId, userData]) => (
                <Card key={userId} className={userData.activeCount >= 3 ? 'border-amber-500/50' : ''}>
                  <CardHeader 
                    className="cursor-pointer py-3"
                    onClick={() => toggleUser(userId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedUsers.has(userId) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {userData.email}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {userData.devices.length} dispositivos • {userData.activeCount} ativos
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {userData.activeCount >= 3 && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            No Limite
                          </Badge>
                        )}
                        <Badge variant={userData.activeCount > 0 ? 'default' : 'secondary'}>
                          {userData.activeCount}/{3}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <AnimatePresence>
                    {expandedUsers.has(userId) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="pt-0 space-y-2">
                          {userData.devices.map((device) => (
                            <div 
                              key={device.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                device.is_active 
                                  ? 'bg-muted/50 border-border' 
                                  : 'bg-muted/20 border-dashed opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  device.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {getDeviceIcon(device.device_type)}
                                </div>
                                
                                <div>
                                  <p className="font-medium text-sm flex items-center gap-2">
                                    {device.device_name}
                                    {device.is_trusted && (
                                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500">
                                        Confiável
                                      </Badge>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {device.browser} • {device.os}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(device.last_seen_at)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {device.is_active ? (
                                  <>
                                    <Badge variant="default" className="bg-green-500/20 text-green-500">
                                      Ativo
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeactivateDevice(device.id, device.device_name);
                                      }}
                                    >
                                      <Power className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="secondary">Inativo</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
              
              {Object.keys(devicesByUser).length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum dispositivo encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tab: Tentativas Bloqueadas */}
        <TabsContent value="attempts" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {blockedAttempts.map((attempt) => (
                <Card key={attempt.id} className={!attempt.resolved ? 'border-destructive/30' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          attempt.resolved ? 'bg-muted' : 'bg-destructive/10'
                        }`}>
                          {getDeviceIcon(attempt.device_type)}
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">{attempt.user_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.device_name} • {attempt.browser} • {attempt.os}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTime(attempt.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={attempt.resolved ? 'secondary' : 'destructive'}>
                          {attempt.attempt_type.replace(/_/g, ' ')}
                        </Badge>
                        {attempt.resolved ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500">
                            Resolvido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {blockedAttempts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma tentativa bloqueada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
