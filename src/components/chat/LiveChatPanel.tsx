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
  Sparkles,
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

type UserRole = keyof typeof ROLE_CONFIG;

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
  message: ChatMessage;
  isModerator: boolean;
  isLoading: boolean;
  onDelete: (id: string) => void;
  onTimeout: (userId: string) => void;
  onBan: (userId: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
}) => {
  // Mapear campos do ChatMessage para o formato esperado
  const userRole: UserRole = (message as any).user_role || 
    (message.isModerator ? 'moderator' : 'viewer');
  const userName = (message as any).user_name || message.userName || 'Usuário';
  const userAvatar = (message as any).user_avatar || message.avatarUrl;
  const userId = (message as any).user_id || message.id;
  const content = (message as any).content || message.message;
  const isPinned = (message as any).is_pinned || message.isHighlighted;
  const isDeleted = (message as any).is_deleted || false;
  const createdAt = (message as any).created_at || new Date().toISOString();

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
        "hover:bg-muted/50",
        isPinned && "bg-primary/10 border-l-2 border-primary"
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
              "text-[11px] font-bold",
              userRole === 'owner' && "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
              userRole === 'admin' && "bg-gradient-to-br from-red-500 to-pink-600 text-white",
              userRole === 'moderator' && "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
              userRole === 'beta' && "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
              userRole === 'viewer' && "bg-muted text-foreground"
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
                <Pin className="h-3.5 w-3.5 text-primary" />
              </motion.div>
            )}
            
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(createdAt), { 
                addSuffix: false, 
                locale: ptBR 
              })}
            </span>
          </div>
          
          <p className="text-sm text-foreground/85 break-words mt-1.5 leading-relaxed">
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
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48"
            >
              <DropdownMenuItem 
                onClick={() => onPin(message.id, isPinned)}
              >
                {isPinned ? (
                  <><PinOff className="h-4 w-4 mr-2" /> Desafixar</>
                ) : (
                  <><Pin className="h-4 w-4 mr-2" /> Fixar mensagem</>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onTimeout(userId)}
                className="text-amber-500 focus:text-amber-400"
              >
                <Timer className="h-4 w-4 mr-2" />
                Timeout 5min
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onBan(userId)}
                className="text-destructive focus:text-destructive"
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

export function LiveChatPanel({ 
  liveId, 
  className, 
  compact = false,
  maxHeight = '500px',
  showViewerCount = true,
  isModerator: propIsModerator,
}: LiveChatPanelProps) {
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
    isModerator: hookIsModerator,
    isAdmin,
    reconnect,
    hasMoreMessages,
  } = useLiveChat({ liveId });

  const isModerator = propIsModerator ?? hookIsModerator;

  const {
    messages,
    isConnected,
    isLoading,
    error,
    viewerCount,
    isSending,
    cooldownSeconds,
  } = state;

  // Auto-scroll
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      lastMessageCount.current = messages.length;
      if (isAutoScrolling.current && scrollRef.current) {
        const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          requestAnimationFrame(() => {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: 'smooth'
            });
          });
        }
      }
    }
  }, [messages.length]);

  // Scroll event listener
  useEffect(() => {
    const handleScrollEvent = () => {
      if (scrollRef.current) {
        const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
          isAutoScrolling.current = true;
          setShowScrollButton(false);
        }
      }
    };
    
    window.addEventListener('chat-scroll-bottom', handleScrollEvent);
    return () => window.removeEventListener('chat-scroll-bottom', handleScrollEvent);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    isAutoScrolling.current = isAtBottom;
    setShowScrollButton(!isAtBottom && messages.length > 10);
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    isAutoScrolling.current = true;
    setShowScrollButton(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending || cooldownSeconds > 0) return;
    
    const success = await sendMessage(inputValue.trim());
    if (success) {
      setInputValue('');
      inputRef.current?.focus();
      isAutoScrolling.current = true;
    }
  }, [inputValue, sendMessage, isSending, cooldownSeconds]);

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

  const canSend = inputValue.trim().length > 0 && !isSending && cooldownSeconds === 0 && isConnected;

  return (
    <div className={cn('flex flex-col bg-card rounded-xl border overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="h-5 w-5 text-primary" />
            {isConnected && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <span className="font-semibold">Chat ao Vivo</span>
          
          {isModerator && (
            <Badge variant="secondary" className="text-[10px]">
              <Shield className="h-3 w-3 mr-1" />
              MOD
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {showViewerCount && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{viewerCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Espectadores online</TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'flex items-center gap-1 text-xs',
                isConnected ? 'text-green-500' : 'text-destructive'
              )}>
                {isConnected ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </TooltipContent>
          </Tooltip>

          {!isConnected && reconnect && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={reconnect}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1">
        <ScrollArea 
          ref={scrollRef}
          className="h-full"
          style={{ maxHeight }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Sparkles className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  isModerator={isModerator}
                  isLoading={isLoading}
                  onDelete={handleDelete}
                  onTimeout={handleTimeout}
                  onBan={handleBan}
                  onPin={handlePin}
                />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={scrollToBottom}
                className="shadow-lg"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Novas mensagens
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t bg-muted/20">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                cooldownSeconds > 0 
                  ? `Aguarde ${cooldownSeconds}s...` 
                  : !isConnected
                    ? 'Reconectando...'
                    : 'Digite sua mensagem...'
              }
              disabled={!isConnected || cooldownSeconds > 0}
              className="pr-12"
              maxLength={500}
            />
            {inputValue.length > 400 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {500 - inputValue.length}
              </span>
            )}
          </div>
          
          <Button 
            onClick={handleSend}
            size="icon"
            disabled={!canSend}
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cooldownSeconds > 0 ? (
              <span className="text-xs font-mono">{cooldownSeconds}</span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'ban' ? 'Banir Usuário' : 'Limpar Chat'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'ban' 
                ? 'Tem certeza que deseja banir este usuário? Esta ação não pode ser desfeita.'
                : 'Tem certeza que deseja limpar todas as mensagens do chat?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction?.type === 'ban' ? confirmBan : confirmClearChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default LiveChatPanel;
