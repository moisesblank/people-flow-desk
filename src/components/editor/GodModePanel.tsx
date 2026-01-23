// ============================================
// SYNAPSE v16.0 - GOD MODE PANEL ULTIMATE
// Painel de controle para o MODO MASTER
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGodMode } from '@/stores/godModeStore';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, X, Eye, EyeOff, 
  Users, Activity, LayoutDashboard, Calendar,
  DollarSign, Brain, Shield, Database, ExternalLink,
  MousePointer2, Keyboard, Sparkles, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const quickNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Activity, label: 'Monitoramento', path: '/monitoramento' },
  { icon: Users, label: 'Funcionários', path: '/funcionarios' },
  { icon: DollarSign, label: 'Finanças', path: '/financas-pessoais' },
  { icon: Calendar, label: 'Calendário', path: '/calendario' },
  { icon: Brain, label: 'Simulados', path: '/simulados' },
  { icon: Shield, label: 'Configurações', path: '/configuracoes' },
  { icon: Database, label: 'Backup', path: '/configuracoes?tab=backup' },
];

export function GodModePanel() {
  const { isOwner, isActive, isLoading, toggle, deactivate } = useGodMode();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(true);
  const [showNav, setShowNav] = useState(false);
  const [showTip, setShowTip] = useState(true);

  // Esconder dica após 5 segundos
  useEffect(() => {
    if (isActive && showTip) {
      const timeout = setTimeout(() => setShowTip(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [isActive, showTip]);

  // Resetar dica quando ativa
  useEffect(() => {
    if (isActive) {
      setShowTip(true);
      setIsMinimized(false);
    }
  }, [isActive]);

  // Não mostrar se não for owner ou estiver carregando
  if (isLoading || !isOwner) return null;

  return (
    <>
      {/* Indicador fixo quando ativo */}
      {isActive ? (
        <motion.div
          key="godmode-active-indicator"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm font-medium shadow-lg"
          style={{
            background: 'linear-gradient(135deg, hsl(280 80% 50%), hsl(328 100% 54%))'
          }}
          data-godmode-panel="true"
        >
          <MousePointer2 className="w-4 h-4 animate-pulse" />
          MODO MASTER - Clique em qualquer texto/imagem
          <span className="text-xs opacity-70 ml-2">Ctrl+Shift+E sai</span>
        </motion.div>
      ) : null}

      {/* Botão flutuante quando minimizado */}
      {!isActive && isMinimized ? (
        <motion.div
          key="godmode-minimized-btn"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-24 right-6 z-[9998]"
          data-godmode-panel="true"
        >
          <Button
            onClick={() => {
              setIsMinimized(false);
              toggle();
            }}
            className={cn(
              "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
              "bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
              "hover:scale-110 hover:shadow-2xl"
            )}
            style={{
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)'
            }}
          >
            <Wand2 className="h-6 w-6 text-white" />
          </Button>
          
          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <div className="bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-2 shadow-xl">
              <p className="text-xs font-medium text-primary flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Modo Master
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Ctrl+Shift+E
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      {/* Painel expandido */}
      {(!isMinimized || isActive) ? (
        <motion.div
          key="godmode-expanded-panel"
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 20 }}
          className="fixed bottom-4 right-4 z-[9999] w-72 rounded-xl shadow-2xl border border-primary/30 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(0 0% 8%), hsl(0 0% 5%))'
          }}
          data-godmode-panel="true"
        >
          {/* Header */}
          <div 
            className="p-3 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, hsl(280 80% 30% / 0.5), hsl(328 80% 35% / 0.5))'
            }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">MODO MASTER</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 border-primary/30 text-primary">
                v16
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-white/10"
              onClick={() => {
                if (isActive) deactivate();
                setIsMinimized(true);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3">
            {/* Toggle principal */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <Eye className="w-4 h-4 text-primary" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Edição ativa</span>
              </div>
              <Switch 
                checked={isActive} 
                onCheckedChange={toggle}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Dica quando ativo */}
            {isActive && showTip ? (
              <motion.div
                key="godmode-tip"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-start gap-2">
                  <MousePointer2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-primary">
                      Clique para editar
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Clique em qualquer texto ou imagem para editar em tempo real
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* Navegação Rápida */}
            <div className="space-y-2">
              <button
                onClick={() => setShowNav(!showNav)}
                className="flex items-center justify-between w-full text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>Navegação Rápida</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              
              {showNav ? (
                <motion.div
                  key="godmode-nav"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-4 gap-1.5"
                >
                  {quickNavItems.map((item, index) => (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => navigate(item.path)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all"
                        >
                          <item.icon className="w-4 h-4" />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </motion.div>
              ) : null}
            </div>

            {/* Atalhos */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Keyboard className="h-3 w-3" />
                Atalhos
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ativar/Desativar</span>
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Ctrl+Shift+E</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">⚡ Quick Add</span>
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Ctrl+Shift+Q</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salvar edição</span>
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelar</span>
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}
