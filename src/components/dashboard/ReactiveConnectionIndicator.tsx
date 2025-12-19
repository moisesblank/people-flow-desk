// ============================================
// PLANILHA VIVA - INDICADOR DE CONEXÃO
// Mostra status da conexão realtime
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Zap, RefreshCw } from "lucide-react";
import { useReactiveFinance } from "@/contexts/ReactiveFinanceContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReactiveConnectionIndicatorProps {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ReactiveConnectionIndicator({ 
  showLabel = true,
  size = "md"
}: ReactiveConnectionIndicatorProps) {
  const { isConnected, isLoading, forceRefresh, metrics } = useReactiveFinance();

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div 
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={forceRefresh}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
              >
                <RefreshCw className={cn(sizeClasses[size], "text-primary")} />
              </motion.div>
            ) : isConnected ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="relative"
              >
                <Zap className={cn(sizeClasses[size], "text-green-500")} />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
              </motion.div>
            ) : (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <WifiOff className={cn(sizeClasses[size], "text-yellow-500")} />
              </motion.div>
            )}
          </AnimatePresence>

          {showLabel && (
            <AnimatePresence mode="wait">
              <motion.span
                key={isLoading ? "loading" : isConnected ? "connected" : "disconnected"}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className={cn(
                  textSizes[size],
                  "font-medium",
                  isLoading ? "text-primary" :
                  isConnected ? "text-green-500" : "text-yellow-500"
                )}
              >
                {isLoading ? "Atualizando..." : isConnected ? "Tempo Real" : "Offline"}
              </motion.span>
            </AnimatePresence>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <p className="font-semibold">
            {isConnected ? "Conexão Ativa" : "Conexão Perdida"}
          </p>
          <p className="text-muted-foreground">
            Última atualização: {metrics.lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Clique para atualizar manualmente
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
