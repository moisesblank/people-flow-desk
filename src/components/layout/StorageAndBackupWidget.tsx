// ============================================
// MOISÉS MEDEIROS v10.0 - STORAGE & BACKUP WIDGET
// Indicador de espaço e backup em tempo real
// UPGRADE: Contador de tabelas e registros
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useJSONWorker } from "@/hooks/useWebWorker";
import { HardDrive, Download, RefreshCw, Cloud, Loader2, CheckCircle2, Database, FileStack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
  buckets: { name: string; size: number }[];
  totalRecords?: number;
  totalTables?: number;
}

interface BackupWidgetProps {
  collapsed?: boolean;
}

export function StorageAndBackupWidget({ collapsed = false }: BackupWidgetProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  
  // 🏛️ LEI I - Web Worker para JSON (UI fluida durante backup grande)
  const { stringify: jsonStringify } = useJSONWorker();

  // Formatar bytes para leitura humana
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatar número grande
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Buscar informações de storage em tempo real
  const fetchStorageInfo = async () => {
    setIsLoadingStorage(true);
    try {
      // Lista todos os buckets e calcula o tamanho
      const buckets = ['documentos', 'avatars', 'certificados', 'comprovantes', 'aulas', 'arquivos', 'whatsapp-attachments'];
      const bucketSizes: { name: string; size: number }[] = [];
      let totalUsed = 0;

      for (const bucketName of buckets) {
        try {
          const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 1000 });

          if (!error && files) {
            let bucketSize = 0;
            for (const file of files) {
              if (file.metadata?.size) {
                bucketSize += file.metadata.size;
              }
            }
            bucketSizes.push({ name: bucketName, size: bucketSize });
            totalUsed += bucketSize;
          }
        } catch {
          // Bucket pode não existir ou não ter permissão
        }
      }

      // Limite padrão do Supabase: 1GB para free tier, 100GB para Pro
      const totalLimit = 100 * 1024 * 1024 * 1024; // 100GB em bytes

      setStorageInfo({
        used: totalUsed,
        total: totalLimit,
        percentage: (totalUsed / totalLimit) * 100,
        buckets: bucketSizes
      });
    } catch (error) {
      console.error('Error fetching storage info:', error);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Backup em tempo real
  const handleQuickBackup = async () => {
    setIsBackingUp(true);
    setBackupSuccess(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Você precisa estar logado");
      }

      // Chamar edge function de backup
      const response = await supabase.functions.invoke('backup-data', {
        body: { format: 'json', tables: 'all' },
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || "Erro no backup");
      }

      // 🏛️ LEI I - Web Worker para JSON stringify (UI fluida)
      const jsonContent = await jsonStringify(data, true);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-completo-${new Date().toISOString().split("T")[0]}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupSuccess(true);
      setLastBackup(new Date().toISOString());
      toast.success(`Backup realizado! ${data.total_records} registros exportados.`);
      
      // Reset success indicator after 3 seconds
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (error) {
      console.error("Backup error:", error);
      toast.error(error instanceof Error ? error.message : "Erro no backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  // Atualizar storage a cada 30 segundos + PATCH-031: jitter anti-herd (0-5s)
  useEffect(() => {
    fetchStorageInfo();
    const jitter = Math.floor(Math.random() * 5000);
    const interval = setInterval(fetchStorageInfo, 30000 + jitter);
    return () => clearInterval(interval);
  }, []);

  // Carregar último backup do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lastBackupDate');
    if (saved) setLastBackup(saved);
  }, []);

  // Salvar último backup no localStorage
  useEffect(() => {
    if (lastBackup) {
      localStorage.setItem('lastBackupDate', lastBackup);
    }
  }, [lastBackup]);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchStorageInfo}
              disabled={isLoadingStorage}
              className="h-8 w-8"
            >
              {isLoadingStorage ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {storageInfo ? `${formatBytes(storageInfo.used)} usado` : 'Verificar espaço'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleQuickBackup}
              disabled={isBackingUp}
              className="h-8 w-8"
            >
              {isBackingUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : backupSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Backup Rápido</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 mb-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
    >
      {/* Storage Section */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Armazenamento</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStorageInfo}
            disabled={isLoadingStorage}
            className="h-6 w-6"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingStorage ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {storageInfo ? (
          <>
            <Progress 
              value={storageInfo.percentage} 
              className="h-2 bg-muted"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{formatBytes(storageInfo.used)} usado</span>
              <span>{formatBytes(storageInfo.total)} total</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Backup Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleQuickBackup}
        disabled={isBackingUp}
        className="w-full h-8 text-xs gap-2 bg-background/50 hover:bg-background border-primary/30 hover:border-primary"
      >
        <AnimatePresence mode="wait">
          {isBackingUp ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Gerando backup...</span>
            </motion.div>
          ) : backupSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-green-600"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Backup concluído!</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <Download className="h-3 w-3" />
              <span>Backup Completo</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Last Backup Info */}
      {lastBackup && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Último: {new Date(lastBackup).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}
    </motion.div>
  );
}
