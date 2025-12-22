// ============================================
// 🔥 COMPONENTE: LiveChatPanel v2.0 - ULTRA EDITION
// Chat em tempo real para lives - 5.000+ simultâneos
// Design 2300 - Futurista, Glassmorphism, Neon
// Performance MÁXIMA + UX Fluida
// ============================================

import { useState, useRef, useEffect, useCallback, memo, forwardRef } from 'react';
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
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Radio,
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
  theme?: 'dark' | 'light' | 'neon';
}

// ============================================
// COMPONENTE DE BADGE POR ROLE
// ============================================
const RoleBadge = memo(({ role }: { role: ChatMessage['user_role'] }) => {
  switch (role) {
    case 'owner':
      return (
        <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-black text-[10px] px-1.5 py-0 font-bold shadow-lg shadow-amber-500/30">
          <Sparkles className="h-2.5 w-2.5 mr-0.5 animate-pulse" />
          DONO
        </Badge>
      );
    case 'admin':
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-1.5 py-0 font-bold">
          <Shield className="h-2.5 w-2.5 mr-0.5" />
          ADMIN
        </Badge>
      );
    case 'moderator':
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] px-1.5 py-0">
          <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
          MOD
        </Badge>
      );
    case 'beta':
      return (
        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] px-1.5 py-0">
          <Zap className="h-2.5 w-2.5 mr-0.5" />
          BETA
        </Badge>
      );
    default:
      return null;
  }
});
RoleBadge.displayName = 'RoleBadge';

// ============================================
// COMPONENTE DE MENSAGEM INDIVIDUAL
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
  if (message.is_deleted) {
    return (
      <div className="px-3 py-1 opacity-40 italic text-xs text-muted-foreground flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Mensagem removida por moderador
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "group px-3 py-2.5 hover:bg-white/5 transition-all duration-200",
        message.is_pinned && "bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 shadow-inner"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar com anel de status */}
        <div className="relative">
          <Avatar className={cn(
            "h-8 w-8 ring-2 transition-all",
            message.user_role === 'owner' && "ring-amber-500 shadow-lg shadow-amber-500/30",
            message.user_role === 'admin' && "ring-red-500",
            message.user_role === 'moderator' && "ring-purple-500",
            message.user_role === 'beta' && "ring-cyan-500",
            message.user_role === 'viewer' && "ring-white/20"
          )}>
            <AvatarImage src={message.user_avatar} />
            <AvatarFallback className={cn(
              "text-[10px] font-bold",
              message.user_role === 'owner' && "bg-gradient-to-br from-amber-500 to-orange-600 text-black",
              message.user_role === 'admin' && "bg-gradient-to-br from-red-500 to-pink-600",
              message.user_role === 'moderator' && "bg-gradient-to-br from-purple-500 to-indigo-600",
              message.user_role === 'beta' && "bg-gradient-to-br from-cyan-500 to-blue-600",
              message.user_role === 'viewer' && "bg-gradient-to-br from-gray-600 to-gray-800"
            )}>
              {message.user_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {message.user_role === 'owner' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              "font-semibold text-sm truncate max-w-[120px]",
              message.user_role === 'owner' && "text-amber-400",
              message.user_role === 'admin' && "text-red-400",
              message.user_role === 'moderator' && "text-purple-400",
              message.user_role === 'beta' && "text-cyan-400",
              message.user_role === 'viewer' && "text-white/90"
            )}>
              {message.user_name}
            </span>
            <RoleBadge role={message.user_role} />
            {message.is_pinned && (
              <Tooltip>
                <TooltipTrigger>
                  <Pin className="h-3 w-3 text-amber-500 animate-pulse" />
                </TooltipTrigger>
                <TooltipContent>Mensagem fixada</TooltipContent>
              </Tooltip>
            )}
            <span className="text-[10px] text-white/30 ml-auto">
              {formatDistanceToNow(new Date(message.created_at), { 
                addSuffix: false, 
                locale: ptBR 
              })}
            </span>
          </div>
          <p className="text-sm text-white/85 break-words mt-1 leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Ações de moderação */}
        {isModerator && !isLoading && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/10"
              >
                <MoreVertical className="h-3.5 w-3.5 text-white/60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-black/90 backdrop-blur-xl border-white/10">
              <DropdownMenuItem 
                onClick={() => onPin(message.id, message.is_pinned)}
                className="text-white/80 focus:text-white focus:bg-white/10"
              >
                {message.is_pinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Desafixar
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Fixar mensagem
                  </>
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
                onClick={() => onTimeout(message.user_id)}
                className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10"
              >
                <Timer className="h-4 w-4 mr-2" />
                Timeout 5min
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onBan(message.user_id)}
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
  theme = 'dark'
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
  } = useLiveChat(liveId);

  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (state.messages.length > lastMessageCount.current) {
      lastMessageCount.current = state.messages.length;
      if (isAutoScrolling.current && scrollRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      }
    }
  }, [state.messages.length]);

  // Listener para scroll to bottom via evento
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

  // Handler de scroll para detectar posição
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    isAutoScrolling.current = isAtBottom;
    setShowScrollButton(!isAtBottom && state.messages.length > 10);
  }, [state.messages.length]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      isAutoScrolling.current = true;
      setShowScrollButton(false);
    }
  }, []);

  // Enviar mensagem
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    const success = await sendMessage(inputValue);
    if (success) {
      setInputValue('');
      inputRef.current?.focus();
      isAutoScrolling.current = true;
    }
  }, [inputValue, sendMessage]);

  // Handler de tecla Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Ações de moderação com feedback
  const handleDelete = useCallback(async (messageId: string) => {
    const success = await moderation.deleteMessage(messageId);
    if (!success && moderation.error) {
      console.error(moderation.error);
    }
  }, [moderation]);

  const handleTimeout = useCallback(async (userId: string) => {
    const success = await moderation.timeoutUser(userId, 5 * 60 * 1000, 'Timeout por moderador');
    if (!success && moderation.error) {
      console.error(moderation.error);
    }
  }, [moderation]);

  const handleBan = useCallback(async (userId: string) => {
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

  // Calcular tempo restante de cooldown
  const cooldownSeconds = Math.ceil(rateLimit.state.cooldownRemaining / 1000);
  const canSend = rateLimit.state.canSend && inputValue.trim().length > 0 && !state.isBanned && !state.isTimedOut && state.chatEnabled;
  const charPercent = (inputValue.length / rateLimit.config.maxChars) * 100;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          "flex flex-col rounded-2xl overflow-hidden relative",
          "bg-gradient-to-b from-black/70 via-black/80 to-black/90",
          "backdrop-blur-2xl border border-white/10",
          "shadow-2xl shadow-black/60",
          compact ? "h-[400px]" : "h-[600px]",
          className
        )}
      >
        {/* Efeito de borda brilhante */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-cyan-500/20 opacity-50 pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MessageCircle className="h-5 w-5 text-primary" />
              {state.isConnected && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="font-bold text-white">Chat ao Vivo</span>
            {state.isSlowMode && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">
                <Clock className="h-3 w-3 mr-1 animate-pulse" />
                Slow Mode
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
              <Radio className="h-3 w-3 text-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-400">LIVE</span>
            </div>
            
            {/* Contador de viewers */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-sm text-white/70 bg-white/5 px-2 py-1 rounded-lg">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{state.viewerCount.toLocaleString()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {state.viewerCount.toLocaleString()} espectadores online
              </TooltipContent>
            </Tooltip>

            {/* Status de conexão */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    state.isConnected ? "bg-green-500/10" : "bg-red-500/10"
                  )}
                  onClick={!state.isConnected ? reconnect : undefined}
                >
                  {state.isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {state.isConnected ? 'Conectado' : 'Desconectado - Clique para reconectar'}
              </TooltipContent>
            </Tooltip>

            {/* Controles de moderação */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10">
                    <Shield className="h-4 w-4 text-purple-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-black/95 backdrop-blur-xl border-white/10">
                  <DropdownMenuItem 
                    onClick={moderation.enableGlobalSlowMode}
                    className="text-white/80 focus:text-white focus:bg-white/10"
                  >
                    <Clock className="h-4 w-4 mr-2 text-amber-400" />
                    Ativar Slow Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={moderation.disableGlobalSlowMode}
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
                    Limpar Todo Chat
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
              <div className="px-4 py-2.5 flex items-start gap-2.5">
                <Pin className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-400 text-sm">
                      {state.pinnedMessage.user_name}
                    </span>
                    <RoleBadge role={state.pinnedMessage.user_role} />
                  </div>
                  <p className="text-sm text-white/80 line-clamp-2 mt-0.5">
                    {state.pinnedMessage.content}
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
                "border-b px-4 py-2.5 flex items-center gap-2",
                state.isBanned 
                  ? "bg-red-500/10 border-red-500/30" 
                  : "bg-amber-500/10 border-amber-500/30"
              )}
            >
              {state.isBanned ? (
                <>
                  <Ban className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-400">Você foi banido deste chat</span>
                </>
              ) : (
                <>
                  <Timer className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-400">
                    Você está em timeout. Aguarde para enviar mensagens.
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
                  className="text-xs text-white/50 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Carregar mensagens anteriores
                </Button>
              </div>
            )}

            {/* Loading */}
            {state.isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-white/50">Carregando chat...</p>
              </div>
            )}

            {/* Mensagens */}
            <div className="py-2">
              <AnimatePresence mode="popLayout">
                {state.messages.map((message) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
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

            {/* Sem mensagens */}
            {!state.isLoading && state.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-white/40">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-sm font-medium">Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1">Seja o primeiro a comentar!</p>
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
                className="absolute bottom-2 left-1/2 -translate-x-1/2"
              >
                <Button
                  size="sm"
                  onClick={scrollToBottom}
                  className="rounded-full shadow-lg bg-primary/90 hover:bg-primary"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
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
                <span>{state.error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="relative p-3 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          {/* Cooldown indicator */}
          <AnimatePresence>
            {!rateLimit.state.canSend && !state.isBanned && !state.isTimedOut && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center gap-2 text-xs text-amber-400 mb-2 px-1"
              >
                <Clock className="h-3 w-3 animate-pulse" />
                Aguarde {cooldownSeconds}s para enviar outra mensagem
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-amber-500"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: cooldownSeconds, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  state.isBanned 
                    ? "Você está banido..." 
                    : state.isTimedOut
                    ? "Você está em timeout..."
                    : !state.chatEnabled
                    ? "Chat desativado..."
                    : "Digite sua mensagem..."
                }
                disabled={state.isBanned || state.isTimedOut || !state.isConnected || !state.chatEnabled}
                maxLength={rateLimit.config.maxChars}
                className={cn(
                  "flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30",
                  "focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
                  "rounded-xl pr-12 transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              
              {/* Indicador de caracteres circular */}
              {inputValue.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="relative w-6 h-6">
                    <svg className="w-6 h-6 -rotate-90">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-white/10"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${(charPercent / 100) * 62.83} 62.83`}
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
                "rounded-xl h-10 w-10 p-0",
                "bg-gradient-to-r from-primary to-cyan-500",
                "hover:from-primary/90 hover:to-cyan-500/90",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "shadow-lg shadow-primary/30 hover:shadow-primary/50",
                "transition-all duration-200"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Contador de caracteres */}
          {inputValue.length > 0 && (
            <div className="flex justify-end mt-1.5 px-1">
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                charPercent > 90 ? "text-red-400" : 
                charPercent > 70 ? "text-amber-400" : 
                "text-white/30"
              )}>
                {inputValue.length}/{rateLimit.config.maxChars}
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
                ? 'Tem certeza que deseja banir este usuário? Ele não poderá mais enviar mensagens neste chat.'
                : 'Tem certeza que deseja limpar todas as mensagens do chat? Esta ação não pode ser desfeita.'
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
