// ============================================
// SYNAPSE v14.0 - HOTMART SYNC WIDGET
// Sincronização automática com Hotmart
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/utils";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
  Link2,
  Unlink,
  Clock,
  Zap,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HotmartStats {
  totalSales: number;
  totalRevenue: number;
  totalAffiliates: number;
  pendingCommissions: number;
  lastSync: string | null;
  syncStatus: "connected" | "disconnected" | "syncing" | "error";
}

interface SyncConfig {
  autoSync: boolean;
  syncInterval: "hourly" | "daily" | "weekly";
  syncAffiliates: boolean;
  syncSales: boolean;
  syncStudents: boolean;
}

export function HotmartSyncWidget() {
  const [stats, setStats] = useState<HotmartStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalAffiliates: 0,
    pendingCommissions: 0,
    lastSync: null,
    syncStatus: "disconnected"
  });
  const [config, setConfig] = useState<SyncConfig>({
    autoSync: true,
    syncInterval: "daily",
    syncAffiliates: true,
    syncSales: true,
    syncStudents: true
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    loadStats();
    loadConfig();
  }, []);

  const loadStats = async () => {
    try {
      // Get affiliate stats
      const { data: affiliates } = await supabase.from("affiliates").select("*");
      const totalAffiliates = affiliates?.length || 0;
      const totalSales = affiliates?.reduce((acc, a) => acc + (a.total_vendas || 0), 0) || 0;
      const totalCommissions = affiliates?.reduce((acc, a) => acc + (a.comissao_total || 0), 0) || 0;

      // Get Hotmart transactions
      const { data: transactions } = await supabase
        .from("synapse_transactions")
        .select("*")
        .eq("source", "hotmart");
      
      const totalRevenue = transactions?.reduce((acc, t) => acc + (t.amount || 0), 0) || 0;

      // Get last sync
      const { data: lastSyncLog } = await supabase
        .from("integration_events")
        .select("created_at")
        .eq("source", "hotmart")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setStats({
        totalSales,
        totalRevenue,
        totalAffiliates,
        pendingCommissions: totalCommissions,
        lastSync: lastSyncLog?.created_at || null,
        syncStatus: lastSyncLog ? "connected" : "disconnected"
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadConfig = () => {
    const saved = localStorage.getItem("hotmart_sync_config");
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  };

  const saveConfig = (newConfig: SyncConfig) => {
    setConfig(newConfig);
    localStorage.setItem("hotmart_sync_config", JSON.stringify(newConfig));
    toast.success("Configurações salvas!");
  };

  const syncWithHotmart = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setStats(prev => ({ ...prev, syncStatus: "syncing" }));

    // 🚀 PATCH 5K: Declarar interval fora do try para garantir cleanup
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate sync progress
      progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 15, 85));
      }, 500);

      // Trigger webhook check
      const { data, error } = await supabase.functions.invoke("webhook-handler", {
        body: {
          source: "manual_sync",
          event: "SYNC_REQUEST",
          data: {
            sync_type: "full",
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      setSyncProgress(100);

      // Log sync event
      await supabase.from("integration_events").insert([{
        event_type: "manual_sync",
        source: "hotmart",
        source_id: `sync_${Date.now()}`,
        payload: JSON.parse(JSON.stringify({ triggered_at: new Date().toISOString(), ...config }))
      }]);

      toast.success("Sincronização concluída!");
      setStats(prev => ({ 
        ...prev, 
        syncStatus: "connected",
        lastSync: new Date().toISOString()
      }));

      loadStats();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error("Erro na sincronização");
      setStats(prev => ({ ...prev, syncStatus: "error" }));
    } finally {
      // 🚀 PATCH 5K: Cleanup GARANTIDO no finally (evita memory leak)
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  // formatCurrency importado de @/utils

  const getStatusColor = () => {
    switch (stats.syncStatus) {
      case "connected": return "text-[hsl(var(--stats-green))]";
      case "syncing": return "text-[hsl(var(--stats-blue))]";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = () => {
    switch (stats.syncStatus) {
      case "connected":
        return <Badge variant="outline" className="gap-1 text-[hsl(var(--stats-green))] border-[hsl(var(--stats-green))]"><CheckCircle2 className="h-3 w-3" />Conectado</Badge>;
      case "syncing":
        return <Badge variant="outline" className="gap-1 text-[hsl(var(--stats-blue))] border-[hsl(var(--stats-blue))]"><RefreshCw className="h-3 w-3 animate-spin" />Sincronizando</Badge>;
      case "error":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Erro</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Unlink className="h-3 w-3" />Desconectado</Badge>;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Hotmart</h3>
              {getStatusBadge()}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsConfigOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Vendas</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.totalSales}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Receita</span>
            </div>
            <p className="text-xl font-bold text-[hsl(var(--stats-green))]">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Afiliados</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.totalAffiliates}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Comissões</span>
            </div>
            <p className="text-xl font-bold text-[hsl(var(--stats-purple))]">{formatCurrency(stats.pendingCommissions)}</p>
          </div>
        </div>

        {/* Last Sync */}
        {stats.lastSync && (
          <p className="text-xs text-muted-foreground mb-4">
            Última sincronização: {formatDistanceToNow(new Date(stats.lastSync), { addSuffix: true, locale: ptBR })}
          </p>
        )}

        {/* Sync Progress */}
        {isSyncing && (
          <div className="mb-4">
            <Progress value={syncProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              Sincronizando dados... {syncProgress}%
            </p>
          </div>
        )}

        {/* Sync Button */}
        <Button 
          className="w-full gap-2" 
          onClick={syncWithHotmart}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sincronizar Agora
            </>
          )}
        </Button>
      </motion.div>

      {/* Config Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Configurações Hotmart
            </DialogTitle>
            <DialogDescription>
              Configure a sincronização automática com Hotmart
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Auto Sync */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="space-y-1">
                <Label className="font-medium">Sincronização Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Sincronizar dados automaticamente
                </p>
              </div>
              <Switch
                checked={config.autoSync}
                onCheckedChange={(checked) => saveConfig({ ...config, autoSync: checked })}
              />
            </div>

            {/* Sync Options */}
            <div className="space-y-4">
              <Label>O que sincronizar</Label>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm">Afiliados</span>
                <Switch
                  checked={config.syncAffiliates}
                  onCheckedChange={(checked) => saveConfig({ ...config, syncAffiliates: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm">Vendas</span>
                <Switch
                  checked={config.syncSales}
                  onCheckedChange={(checked) => saveConfig({ ...config, syncSales: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm">Alunos</span>
                <Switch
                  checked={config.syncStudents}
                  onCheckedChange={(checked) => saveConfig({ ...config, syncStudents: checked })}
                />
              </div>
            </div>

            {/* Webhook URL */}
            <div className="p-4 rounded-lg bg-secondary/30">
              <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
              <code className="block mt-2 text-xs break-all text-primary">
                {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler?source=hotmart`}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-handler?source=hotmart`);
                  toast.success("URL copiada!");
                }}
              >
                Copiar URL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
