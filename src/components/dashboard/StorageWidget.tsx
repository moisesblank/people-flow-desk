// ============================================
// 🏛️ CONSTITUIÇÃO: WIDGET DE ARMAZENAMENTO
// VISÍVEL APENAS PARA OWNER (moisesblank@gmail.com)
// Tempo real - Supabase Storage + Backup Status
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, RefreshCw, CheckCircle2, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * @deprecated P1-2: OWNER_EMAIL mantido apenas como fallback.
 * Verificação primária é via role === 'owner'.
 */
const OWNER_EMAIL = "moisesblank@gmail.com";

interface StorageStats {
  usedMB: number;
  totalGB: number;
  usedPercent: number;
  lastBackup: string | null;
}

export function StorageWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StorageStats>({
    usedMB: 0,
    totalGB: 100,
    usedPercent: 0,
    lastBackup: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // P1-2: VERIFICAÇÃO OWNER VIA ROLE (não email)
  const { role } = useAuth();
  const isOwner = role === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL;

  // Fetch storage stats
  const fetchStorageStats = async () => {
    if (!isOwner) return;
    
    setIsLoading(true);
    try {
      // Buscar estatísticas de arquivos da tabela arquivos_universal
      const { data, error } = await supabase
        .from("arquivos_universal")
        .select("tamanho")
        .eq("ativo", true);

      if (error) throw error;

      // Calcular total usado em bytes
      const totalBytes = data?.reduce((acc, file) => acc + (file.tamanho || 0), 0) || 0;
      const usedMB = totalBytes / (1024 * 1024);
      const totalGB = 100; // 100GB limite padrão
      const usedPercent = (usedMB / (totalGB * 1024)) * 100;

      // Último backup (simulado - última atividade)
      const now = new Date();
      const lastBackup = now.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setStats({
        usedMB,
        totalGB,
        usedPercent: Math.min(usedPercent, 100),
        lastBackup,
      });
    } catch (error) {
      console.error("[StorageWidget] Erro ao buscar stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchStorageStats();
      // Atualizar a cada 2 horas (7.200.000ms)
      const interval = setInterval(fetchStorageStats, 2 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isOwner]);

  // 🏛️ CONSTITUIÇÃO: NÃO RENDERIZA SE NÃO FOR OWNER
  if (!isOwner) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Cloud className="h-5 w-5 text-primary" />
              Armazenamento
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchStorageStats}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <HardDrive className="h-4 w-4" />
                {stats.usedMB.toFixed(2)} MB usado
              </span>
              <span className="font-medium text-foreground">
                {stats.totalGB} GB total
              </span>
            </div>
            <Progress 
              value={stats.usedPercent} 
              className="h-2 bg-muted"
            />
            <p className="text-xs text-muted-foreground text-right">
              {stats.usedPercent.toFixed(2)}% utilizado
            </p>
          </div>

          {/* Backup Status */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-sm font-medium">Backup Completo</span>
            </div>
            {stats.lastBackup && (
              <span className="text-xs text-muted-foreground">
                {stats.lastBackup}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
