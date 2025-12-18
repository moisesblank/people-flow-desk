import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  RefreshCw, 
  Globe, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncStatus {
  lastSync: string | null;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
}

export function WordPressSyncWidget() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios_wordpress_sync")
        .select("*");

      if (!error && data) {
        const activeUsers = data.filter(u => u.status_acesso === "ativo").length;
        const pendingUsers = data.filter(u => u.status_acesso === "aguardando_pagamento").length;
        const lastSyncDate = data.length > 0 
          ? data.reduce((latest, u) => {
              const userSync = u.updated_at;
              return userSync && userSync > (latest || '') ? userSync : latest;
            }, null as string | null)
          : null;

        setSyncStatus({
          lastSync: lastSyncDate,
          totalUsers: data.length,
          activeUsers,
          pendingUsers
        });
      }
    } catch (error) {
      console.error("Erro ao buscar status de sync:", error);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    
    try {
      toast({
        title: "Sincronização Iniciada",
        description: "Buscando usuários do WordPress...",
      });

      const { data, error } = await supabase.functions.invoke("sync-wordpress-users", {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "Sincronização Concluída! ✅",
        description: `${data?.total_synced || 0} usuários sincronizados${data?.total_errors > 0 ? `, ${data.total_errors} erros` : ''}.`,
      });

      // Atualizar status
      await fetchSyncStatus();

    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast({
        title: "Erro na Sincronização",
        description: error instanceof Error ? error.message : "Não foi possível sincronizar.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return "Nunca sincronizado";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const syncProgress = syncStatus.totalUsers > 0 
    ? (syncStatus.activeUsers / syncStatus.totalUsers) * 100 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-blue-500" />
            Sincronização WordPress
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatLastSync(syncStatus.lastSync)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-muted/50 text-center"
          >
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold">{syncStatus.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-green-500/10 text-center"
          >
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold text-green-500">{syncStatus.activeUsers}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-amber-500/10 text-center"
          >
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold text-amber-500">{syncStatus.pendingUsers}</p>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </motion.div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Cobertura de pagamentos</span>
            <span>{syncProgress.toFixed(0)}%</span>
          </div>
          <Progress value={syncProgress} className="h-2" />
        </div>

        {/* Sync Button */}
        <Button 
          onClick={triggerSync} 
          disabled={isSyncing}
          className="w-full"
          variant="outline"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Sincronizar Agora
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Sincroniza usuários do WordPress para o dashboard local
        </p>
      </CardContent>
    </Card>
  );
}
