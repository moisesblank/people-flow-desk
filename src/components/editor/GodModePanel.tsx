// ============================================
// SYNAPSE v14.0 - GOD MODE PANEL
// Painel flutuante do MODO DEUS
// Navegação rápida + Ferramentas de edição
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGodMode } from '@/contexts/GodModeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, X, Eye, EyeOff, History, Palette, 
  Type, Image, Settings, ChevronUp, ChevronDown,
  Users, Activity, LayoutDashboard, Calendar,
  DollarSign, Brain, Shield, Database, ExternalLink,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
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
  const { isOwner, isActive, toggle } = useGodMode();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNav, setShowNav] = useState(false);

  if (!isOwner) return null;

  return (
    <>
      {/* Indicador fixo quando ativo */}
      <AnimatePresence>
        {isActive && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm font-medium shadow-lg"
            style={{
              background: 'linear-gradient(135deg, hsl(280 80% 50%), hsl(328 100% 54%))'
            }}
          >
            <Zap className="w-4 h-4 animate-pulse" />
            MODO DEUS ATIVO
            <span className="text-xs opacity-70 ml-2">Ctrl+Shift+E para sair</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          height: isMinimized ? 'auto' : isExpanded ? 'auto' : 'auto'
        }}
        className={cn(
          "fixed z-[9999] rounded-xl shadow-2xl border border-primary/30 overflow-hidden",
          isMinimized ? "bottom-4 right-4 w-auto" : "bottom-4 right-4 w-72"
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(0 0% 8%), hsl(0 0% 5%))'
        }}
      >
        {/* Header */}
        <div 
          className="p-3 flex items-center justify-between cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, hsl(280 80% 30% / 0.5), hsl(328 80% 35% / 0.5))'
          }}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {!isMinimized && (
              <>
                <span className="text-sm font-semibold text-white">MODO DEUS</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 border-primary/30 text-primary">
                  v14.0
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isMinimized && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
            >
              {isMinimized ? <ChevronUp className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 space-y-3"
            >
              {/* Toggle principal */}
              <Button
                onClick={toggle}
                className={cn(
                  "w-full justify-start gap-2 transition-all",
                  isActive 
                    ? "bg-primary hover:bg-primary/90 text-white" 
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {isActive ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Desativar Edição
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Ativar Edição
                  </>
                )}
              </Button>

              {/* Navegação Rápida */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowNav(!showNav)}
                  className="flex items-center justify-between w-full text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>Navegação Rápida</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                
                <AnimatePresence>
                  {showNav && (
                    <motion.div
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
                  )}
                </AnimatePresence>
              </div>

              {/* Ações rápidas */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Ferramentas
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <Type className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar Textos</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <Image className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar Imagens</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <Palette className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cores</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <History className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Histórico</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Admin
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="justify-start gap-2 text-xs"
                          onClick={() => navigate('/monitoramento')}
                        >
                          <Users className="w-3 h-3" />
                          Usuários
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="justify-start gap-2 text-xs"
                          onClick={() => navigate('/relatorios')}
                        >
                          <Activity className="w-3 h-3" />
                          Relatórios
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Atalhos */}
              <div className="text-center pt-2 border-t border-border/50 space-y-1">
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono">
                    Ctrl+Shift+E
                  </kbd>
                  <span>Toggle</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono">
                    ?
                  </kbd>
                  <span>Ver todos atalhos</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

export default GodModePanel;
