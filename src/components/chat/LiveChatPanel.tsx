// ============================================
// 🔥 COMPONENTE: LiveChatPanel v3.0 - ULTRA DEFINITIVO
// Chat em tempo real - 5.000+ simultâneos
// Design 2300 - Glassmorphism Extremo + Neon
// Performance MÁXIMA + UX Premium
// ============================================

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageCircle,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock,
  Shield,
  ShieldAlert,
  Trash2,
  Ban,
  Timer,
  Pin,
  PinOff,
  MoreVertical,
  RefreshCw,
  Zap,
  ChevronDown,
  Loader2,
  Radio,
  Crown,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useLiveChat, ChatMessage } from '@/hooks/useLiveChat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================
// TIPOS
// ============================================

interface LiveChatPanelProps {
  liveId: string;
  className?: string;
  compact?: boolean;
  maxHeight?: string;
  showViewerCount?: boolean;
  isModerator?: boolean;
}

// Tipo extendido para suportar ambos formatos de mensagem
interface ExtendedChatMessage extends ChatMessage {
  user_role?: 'owner' | 'admin' | 'moderator' | 'beta' | 'viewer';
  user_name?: string;
  user_avatar?: string;
  user_id?: string;
  content?: string;
  is_pinned?: boolean;
  is_deleted?: boolean;
  created_at?: string;
}

type UserRole = 'owner' | 'admin' | 'moderator' | 'beta' | 'viewer';

// ============================================
// CONFIGURAÇÕES DE CORES POR ROLE
// ============================================

const ROLE_CONFIG = {
  owner: {
    badge: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500',
    text: 'text-amber-400',
    ring: 'ring-amber-500',
    icon: Crown,
    label: 'DONO',
    glow: 'shadow-amber-500/50',
  },
  admin: {
    badge: 'bg-gradient-to-r from-red-500 to-pink-500',
    text: 'text-red-400',
    ring: 'ring-red-500',
    icon: Shield,
    label: 'ADMIN',
    glow: 'shadow-red-500/30',
  },
  moderator: {
    badge: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    text: 'text-purple-400',
    ring: 'ring-purple-500',
    icon: ShieldAlert,
    label: 'MOD',
    glow: 'shadow-purple-500/30',
  },
  beta: {
    badge: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    text: 'text-cyan-400',
    ring: 'ring-cyan-500',
    icon: Star,
    label: 'BETA',
    glow: 'shadow-cyan-500/30',
  },
  viewer: {
    badge: 'bg-muted',
    text: 'text-foreground/80',
    ring: 'ring-border',
    icon: null,
    label: null,
    glow: '',
  },
} as const;

// ============================================
// COMPONENTE DE BADGE POR ROLE
// ============================================

const RoleBadge = memo(({ role }: { role: UserRole }) => {
  const config = ROLE_CONFIG[role];
  if (!config.icon || !config.label) return null;
  
  const Icon = config.icon;
  
  return (
    <Badge className={cn(
      config.badge,
      "text-white text-[10px] px-1.5 py-0 font-bold shadow-lg",
      config.glow
    )}>
      <Icon className="h-2.5 w-2.5 mr-0.5" />
      {config.label}
    </Badge>
  );
});
RoleBadge.displayName = 'RoleBadge';

// ============================================
// COMPONENTE DE MENSAGEM
// ============================================

const ChatMessageItem = memo(({ 
  message, 
  isModerator,
  isLoading,
  onDelete,
  onTimeout,
  onBan,
  onPin,
}: { 
  message: ExtendedChatMessage;
  isModerator: boolean;
  isLoading: boolean;
  onDelete: (id: string) => void;
  onTimeout: (userId: string) => void;
  onBan: (userId: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
}) => {
  // Mapear campos para suportar ambos formatos
  const userRole: UserRole = message.user_role || (message.isModerator ? 'moderator' : 'viewer');
  const userName = message.user_name || message.userName || 'Usuário';
  const userAvatar = message.user_avatar || message.avatarUrl;
  const userId = message.user_id || message.userId || message.id;
  const content = message.content || message.message;
  const isPinned = message.is_pinned || message.isPinned || message.isHighlighted;
  const isDeleted = message.is_deleted || message.isDeleted || false;
  const createdAt = message.created_at || message.createdAt || new Date().toISOString();

  const config = ROLE_CONFIG[userRole];
  
  if (isDeleted) {
    return (
      <div className="px-3 py-1.5 opacity-40 italic text-xs text-muted-foreground flex items-center gap-1.5">
        <Trash2 className="h-3 w-3" />
        Mensagem removida
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "group px-4 py-3 transition-all duration-300",
        "hover:bg-white/5",
        isPinned && "bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-l-2 border-amber-500"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar com efeitos */}
        <div className="relative flex-shrink-0">
          <Avatar className={cn(
            "h-9 w-9 ring-2 transition-all duration-300",
            config.ring,
            userRole === 'owner' && "shadow-lg shadow-amber-500/40"
          )}>
            <AvatarImage src={userAvatar} />
            <AvatarFallback className={cn(
              "text-[11px] font-bold text-white",
              userRole === 'owner' && "bg-gradient-to-br from-amber-500 to-orange-600",
              userRole === 'admin' && "bg-gradient-to-br from-red-500 to-pink-600",
              userRole === 'moderator' && "bg-gradient-to-br from-purple-500 to-indigo-600",
              ['beta', 'aluno_presencial', 'beta_expira'].includes(userRole || '') && "bg-gradient-to-br from-cyan-500 to-blue-600",
              userRole === 'viewer' && "bg-gradient-to-br from-gray-600 to-gray-800"
            )}>
              {userName?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Indicador de owner */}
          {userRole === 'owner' && (
            <motion.div 
              className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-2.5 w-2.5 text-black" />
            </motion.div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "font-semibold text-sm truncate max-w-[140px]",
              config.text
            )}>
              {userName}
            </span>
            
            <RoleBadge role={userRole} />
            
            {isPinned && (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Pin className="h-3.5 w-3.5 text-amber-500" />
              </motion.div>
            )}
            
            <span className="text-[10px] text-white/30 ml-auto">
              {formatDistanceToNow(new Date(createdAt), { 
                addSuffix: false, 
                locale: ptBR 
              })}
            </span>
          </div>
          
          <p className="text-sm text-white/85 break-words mt-1.5 leading-relaxed">
            {content}
          </p>
        </div>

        {/* Menu de moderação */}
        {isModerator && !isLoading && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10"
              >
                <MoreVertical className="h-4 w-4 text-white/50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-black/95 backdrop-blur-xl border-white/10"
            >
              <DropdownMenuItem 
                onClick={() => onPin(message.id, isPinned)}
                className="text-white/80 focus:text-white focus:bg-white/10"
              >
                {isPinned ? (
                  <><PinOff className="h-4 w-4 mr-2" /> Desafixar</>
                ) : (
                  <><Pin className="h-4 w-4 mr-2" /> Fixar mensagem</>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              <DropdownMenuItem 
                onClick={() => onDelete(message.id)}
                className="text-white/80 focus:text-white focus:bg-white/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onTimeout(userId)}
                className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10"
              >
                <Timer className="h-4 w-4 mr-2" />
                Timeout 5min
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onBan(userId)}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              >
                <Ban className="h-4 w-4 mr-2" />
                Banir usuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
});
ChatMessageItem.displayName = 'ChatMessageItem';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const LiveChatPanel = memo(({ 
  liveId, 
  className, 
  compact = false,
}: LiveChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{type: 'ban' | 'clear', userId?: string} | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAutoScrolling = useRef(true);
  const lastMessageCount = useRef(0);

  const {
    state,
    sendMessage,
    rateLimit,
    moderation,
    loadMoreMessages,
    isModerator,
    isAdmin,
    reconnect,
    hasMoreMessages,
  } = useLiveChat({ liveId });

  // Estados derivados
  const cooldownSeconds = Math.ceil((rateLimit?.state?.cooldownRemaining || 0) / 1000);
  const maxChars = rateLimit?.config?.maxChars || 500;
  const canSendRateLimit = rateLimit?.state?.canSend ?? true;
  const chatEnabled = state.isChatEnabled !== false;
  
  const canSend = canSendRateLimit && inputValue.trim().length > 0 && !state.isBanned && !state.isTimedOut && chatEnabled;
  const charPercent = (inputValue.length / maxChars) * 100;

  // Auto-scroll
  useEffect(() => {
    if (state.messages.length > lastMessageCount.current) {
      lastMessageCount.current = state.messages.length;
      if (isAutoScrolling.current && scrollRef.current) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    }
  }, [state.messages.length]);

  // Scroll event listener
  useEffect(() => {
    const handleScrollEvent = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        isAutoScrolling.current = true;
        setShowScrollButton(false);
      }
    };
    
    window.addEventListener('chat-scroll-bottom', handleScrollEvent);
    return () => window.removeEventListener('chat-scroll-bottom', handleScrollEvent);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    isAutoScrolling.current = isAtBottom;
    setShowScrollButton(!isAtBottom && state.messages.length > 10);
  }, [state.messages.length]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
    isAutoScrolling.current = true;
    setShowScrollButton(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    const success = await sendMessage(inputValue);
    if (success) {
      setInputValue('');
      inputRef.current?.focus();
      isAutoScrolling.current = true;
    }
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Ações de moderação
  const handleDelete = useCallback(async (messageId: string) => {
    await moderation.deleteMessage(messageId);
  }, [moderation]);

  const handleTimeout = useCallback(async (userId: string) => {
    await moderation.timeoutUser(userId, 5 * 60 * 1000, 'Timeout por moderador');
  }, [moderation]);

  const handleBan = useCallback((userId: string) => {
    setConfirmAction({ type: 'ban', userId });
  }, []);

  const confirmBan = useCallback(async () => {
    if (confirmAction?.userId) {
      await moderation.banUser(confirmAction.userId, 'Banido por moderador');
    }
    setConfirmAction(null);
  }, [moderation, confirmAction]);

  const handlePin = useCallback(async (messageId: string, isPinned: boolean) => {
    if (isPinned) {
      await moderation.unpinMessage(messageId);
    } else {
      await moderation.pinMessage(messageId);
    }
  }, [moderation]);

  const handleClearChat = useCallback(() => {
    setConfirmAction({ type: 'clear' });
  }, []);

  const confirmClearChat = useCallback(async () => {
    await moderation.clearChat();
    setConfirmAction(null);
  }, [moderation]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "flex flex-col rounded-2xl overflow-hidden relative",
          "bg-gradient-to-b from-black/80 via-black/85 to-black/90",
          "backdrop-blur-3xl border border-white/10",
          "shadow-2xl shadow-black/60",
          compact ? "h-[400px]" : "h-[600px]",
          className
        )}
      >
        {/* Efeito de brilho nas bordas */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 opacity-60" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              {state.isConnected && (
                <motion.div 
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            
            <div>
              <h3 className="font-bold text-white text-sm">Chat ao Vivo</h3>
              {state.isSlowMode && (
                <div className="flex items-center gap-1 text-[10px] text-amber-400">
                  <Clock className="h-2.5 w-2.5" />
                  Slow Mode
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Live badge */}
            <motion.div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Radio className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-bold text-red-400 uppercase">LIVE</span>
            </motion.div>
            
            {/* Viewers */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                  <Users className="h-3.5 w-3.5 text-white/60" />
                  <span className="text-xs font-semibold text-white/80">
                    {state.viewerCount.toLocaleString()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{state.viewerCount} online</TooltipContent>
            </Tooltip>

            {/* Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    state.isConnected ? "text-green-500" : "text-red-500"
                  )}
                  onClick={!state.isConnected ? reconnect : undefined}
                >
                  {state.isConnected ? (
                    <Wifi className="h-4 w-4" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {state.isConnected ? 'Conectado' : 'Clique para reconectar'}
              </TooltipContent>
            </Tooltip>

            {/* Admin controls */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                    <Shield className="h-4 w-4 text-purple-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-black/95 backdrop-blur-xl border-white/10">
                  <DropdownMenuItem 
                    onClick={() => moderation.enableGlobalSlowMode?.()}
                    className="text-white/80 focus:text-white focus:bg-white/10"
                  >
                    <Clock className="h-4 w-4 mr-2 text-amber-400" />
                    Ativar Slow Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => moderation.disableGlobalSlowMode?.()}
                    className="text-white/80 focus:text-white focus:bg-white/10"
                  >
                    <Zap className="h-4 w-4 mr-2 text-cyan-400" />
                    Desativar Slow Mode
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    onClick={handleClearChat}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mensagem fixada */}
        <AnimatePresence>
          {state.pinnedMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent"
            >
              <div className="px-4 py-3 flex items-start gap-3">
                <Pin className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-400 text-sm">
                      {(state.pinnedMessage as any).user_name || state.pinnedMessage.userName}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 line-clamp-2 mt-1">
                    {(state.pinnedMessage as any).content || state.pinnedMessage.message}
                  </p>
                </div>
                {isModerator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white/40 hover:text-white"
                    onClick={() => handlePin(state.pinnedMessage!.id, true)}
                  >
                    <PinOff className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status de ban/timeout */}
        <AnimatePresence>
          {(state.isBanned || state.isTimedOut) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "border-b px-4 py-3 flex items-center gap-2",
                state.isBanned 
                  ? "bg-red-500/10 border-red-500/30" 
                  : "bg-amber-500/10 border-amber-500/30"
              )}
            >
              {state.isBanned ? (
                <>
                  <Ban className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-400 font-medium">Você foi banido deste chat</span>
                </>
              ) : (
                <>
                  <Timer className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-400 font-medium">
                    Você está em timeout
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Área de mensagens */}
        <div className="relative flex-1 overflow-hidden">
          <ScrollArea 
            ref={scrollRef}
            className="h-full"
            onScrollCapture={handleScroll}
          >
            {/* Carregar mais */}
            {hasMoreMessages && state.messages.length >= 50 && (
              <div className="flex justify-center py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreMessages}
                  className="text-xs text-white/50 hover:text-white hover:bg-white/10 gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Carregar anteriores
                </Button>
              </div>
            )}

            {/* Loading */}
            {state.isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <div className="absolute inset-0 blur-xl bg-primary/30" />
                </div>
                <p className="text-sm text-white/50">Carregando chat...</p>
              </div>
            )}

            {/* Mensagens */}
            <div className="py-2">
              <AnimatePresence mode="popLayout">
                {state.messages.map((message) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message as ExtendedChatMessage}
                    isModerator={isModerator}
                    isLoading={moderation.isLoading}
                    onDelete={handleDelete}
                    onTimeout={handleTimeout}
                    onBan={handleBan}
                    onPin={handlePin}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Vazio */}
            {!state.isLoading && state.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-white/40">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <MessageCircle className="h-10 w-10 opacity-40" />
                </div>
                <p className="text-sm font-medium">Nenhuma mensagem</p>
                <p className="text-xs mt-1 text-white/30">Seja o primeiro a comentar!</p>
              </div>
            )}
          </ScrollArea>

          {/* Botão de scroll */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2"
              >
                <Button
                  size="sm"
                  onClick={scrollToBottom}
                  className="rounded-full shadow-xl bg-primary hover:bg-primary/90 gap-1.5"
                >
                  <ChevronDown className="h-4 w-4" />
                  Novas mensagens
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Erro */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2.5 bg-red-500/10 border-t border-red-500/20"
            >
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {state.error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="relative p-4 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          {/* Cooldown */}
          <AnimatePresence>
            {!canSendRateLimit && !state.isBanned && !state.isTimedOut && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-amber-400 mb-3"
              >
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                <span>Aguarde {cooldownSeconds}s</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: cooldownSeconds, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  state.isBanned ? "Você está banido..." 
                  : state.isTimedOut ? "Você está em timeout..."
                  : !chatEnabled ? "Chat desativado..."
                  : "Digite sua mensagem..."
                }
                disabled={state.isBanned || state.isTimedOut || !state.isConnected || !chatEnabled}
                maxLength={maxChars}
                className={cn(
                  "flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                  "focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
                  "rounded-xl pr-14 h-11 transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              
              {/* Indicador de caracteres */}
              {inputValue.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="relative w-7 h-7">
                    <svg className="w-7 h-7 -rotate-90">
                      <circle
                        cx="14"
                        cy="14"
                        r="11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-white/10"
                      />
                      <circle
                        cx="14"
                        cy="14"
                        r="11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${(charPercent / 100) * 69} 69`}
                        className={cn(
                          "transition-all duration-200",
                          charPercent > 90 ? "text-red-400" : 
                          charPercent > 70 ? "text-amber-400" : 
                          "text-primary"
                        )}
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "rounded-xl h-11 w-11 p-0",
                "bg-gradient-to-r from-primary to-cyan-500",
                "hover:from-primary/90 hover:to-cyan-500/90",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "shadow-lg shadow-primary/30 hover:shadow-primary/50",
                "transition-all duration-300"
              )}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* Contador */}
          {inputValue.length > 0 && (
            <div className="flex justify-end mt-2">
              <span className={cn(
                "text-[10px] font-medium",
                charPercent > 90 ? "text-red-400" : 
                charPercent > 70 ? "text-amber-400" : 
                "text-white/30"
              )}>
                {inputValue.length}/{maxChars}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Dialog de confirmação */}
      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="bg-black/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction?.type === 'ban' ? 'Confirmar Ban' : 'Limpar Chat'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {confirmAction?.type === 'ban' 
                ? 'Tem certeza? O usuário não poderá mais enviar mensagens.'
                : 'Tem certeza? Todas as mensagens serão removidas.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction?.type === 'ban' ? confirmBan : confirmClearChat}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {confirmAction?.type === 'ban' ? 'Banir' : 'Limpar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

LiveChatPanel.displayName = 'LiveChatPanel';

export default LiveChatPanel;
