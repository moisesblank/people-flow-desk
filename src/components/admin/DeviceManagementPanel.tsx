// ============================================
// 🛡️ DOGMA XI: Painel de Gestão de Dispositivos
// Monitoramento em tempo real (Owner Only)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Smartphone, Tablet, Shield, AlertTriangle, 
  RefreshCw, Search, Trash2, Users, Eye, Clock,
  ChevronDown, ChevronUp, Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DeviceData {
  id: string;
  user_id: string;
  user_email: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  is_active: boolean;
  last_seen_at: string;
  active_count: number;
}

interface SuspiciousUser {
  user_id: string;
  user_email: string;
  device_count: number;
}

export function DeviceManagementPanel() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState<SuspiciousUser[]>([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_all_devices', {
        p_limit: 200,
        p_offset: 0
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        setDevices(result.devices || []);
        setTotalDevices(result.total || 0);
      }

      // Buscar usuários no limite (extrair dos dados já carregados)
      const usersAtLimit = Object.values(
        (result.devices || []).reduce((acc: Record<string, any>, d: DeviceData) => {
          if (!acc[d.user_id]) acc[d.user_id] = { user_id: d.user_id, user_email: d.user_email, count: 0 };
          if (d.is_active) acc[d.user_id].count++;
          return acc;
        }, {})
      ).filter((u: any) => u.count >= 3) as SuspiciousUser[];
      
      setSuspiciousUsers(usersAtLimit.map((u: any) => ({ 
        user_id: u.user_id, 
        user_email: u.user_email, 
        device_count: u.count 
      })));
      
      // Contar usuários únicos
      const uniqueUsers = new Set((result.devices || []).map((d: DeviceData) => d.user_id));
      setTotalUsers(uniqueUsers.size);
    } catch (err) {
      console.error('[ADMIN] Erro ao buscar dispositivos:', err);
      toast.error('Erro ao carregar dispositivos');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDevices();

    // Realtime subscription
    const channel = supabase
      .channel('device-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_devices'
      }, () => {
        fetchDevices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices]);

  const handleDeactivateDevice = async (deviceId: string) => {
    try {
      const { data, error } = await supabase.rpc('deactivate_device', {
        p_device_id: deviceId
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast.success(`Dispositivo "${result.device_name}" desativado`);
        fetchDevices();
      } else {
        toast.error(result.error || 'Erro ao desativar');
      }
    } catch (err) {
      console.error('[ADMIN] Erro:', err);
      toast.error('Erro ao desativar dispositivo');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const filteredDevices = devices.filter(d => 
    d.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.device_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por usuário
  const devicesByUser = filteredDevices.reduce((acc, device) => {
    const key = device.user_id;
    if (!acc[key]) {
      acc[key] = {
        user_email: device.user_email,
        devices: []
      };
    }
    acc[key].devices.push(device);
    return acc;
  }, {} as Record<string, { user_email: string; devices: DeviceData[] }>);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Gestão de Dispositivos
          </h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real • DOGMA XI
          </p>
        </div>
        <Button onClick={fetchDevices} variant="outline" size="sm">
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalDevices}</p>
              <p className="text-sm text-muted-foreground">Dispositivos Totais</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{suspiciousUsers.length}</p>
              <p className="text-sm text-muted-foreground">No Limite (3+)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <Eye className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {devices.filter(d => {
                  const lastSeen = new Date(d.last_seen_at);
                  const now = new Date();
                  return (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Online Agora</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuários no limite */}
      {suspiciousUsers.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-500 flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5" />
              Usuários no Limite de Dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suspiciousUsers.map((user) => (
                <Badge 
                  key={user.user_id} 
                  variant="outline" 
                  className="bg-amber-500/10 border-amber-500/30 text-amber-600"
                >
                  {user.user_email} ({user.device_count} dispositivos)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email ou dispositivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Devices by User */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {Object.entries(devicesByUser).map(([userId, userData]) => (
            <motion.div
              key={userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border rounded-xl overflow-hidden bg-card"
            >
              {/* User Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedUser(expandedUser === userId ? null : userId)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    userData.devices.length >= 3 ? "bg-amber-500/20" : "bg-primary/20"
                  )}>
                    <Users className={cn(
                      "w-5 h-5",
                      userData.devices.length >= 3 ? "text-amber-500" : "text-primary"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{userData.user_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {userData.devices.filter(d => d.is_active).length} dispositivos ativos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {userData.devices.length >= 3 && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      No Limite
                    </Badge>
                  )}
                  {expandedUser === userId ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Devices List */}
              <AnimatePresence>
                {expandedUser === userId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-2 bg-muted/30">
                      {userData.devices.map((device) => (
                        <div 
                          key={device.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            device.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {getDeviceIcon(device.device_type)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {device.device_name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(device.last_seen_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={device.is_active ? "default" : "secondary"}>
                              {device.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {device.is_active && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeactivateDevice(device.id);
                                }}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {Object.keys(devicesByUser).length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dispositivo encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
