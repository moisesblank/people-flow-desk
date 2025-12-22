// ============================================
// 🔥 COMPONENTE: LiveChatPanel
// Chat em tempo real para lives - 5.000 simultâneos
// Design 2300 - Futurista, Glassmorphism, Neon
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
  MoreVertical,
  RefreshCw,
  Zap,
  Sparkles,
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
}

// ============================================
// COMPONENTE DE MENSAGEM INDIVIDUAL
// ============================================
const ChatMessageItem = memo(({ 
  message, 
  isModerator,
  onDelete,
  onTimeout,
  onBan,
  onPin,
}: { 
  message: ChatMessage;
  isModerator: boolean;
  onDelete: (id: string) => void;
  onTimeout: (userId: string) => void;
  onBan: (userId: string) => void;
  onPin: (id: string) => void;
}) => {
  const getRoleBadge = (role: ChatMessage['user_role']) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5 py-0">
            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
            DONO
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-1.5 py-0">
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
  };

  if (message.is_deleted) {
    return (
      <div className="px-3 py-1 opacity-50 italic text-xs text-muted-foreground">
        Mensagem removida
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group px-3 py-2 hover:bg-white/5 transition-colors",
        message.is_pinned && "bg-amber-500/10 border-l-2 border-amber-500"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Avatar */}
        <Avatar className="h-7 w-7 ring-1 ring-white/10">
          <AvatarImage src={message.user_avatar} />
          <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/50 to-primary/30">
            {message.user_name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm text-white/90 truncate max-w-[120px]">
              {message.user_name}
            </span>
            {getRoleBadge(message.user_role)}
            {message.is_pinned && (
              <Pin className="h-3 w-3 text-amber-500" />
            )}
            <span className="text-[10px] text-white/40">
              {formatDistanceToNow(new Date(message.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
          <p className="text-sm text-white/80 break-words mt-0.5">
            {message.content}
          </p>
        </div>

        {/* Ações de moderação */}
        {isModerator && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onPin(message.id)}>
                <Pin className="h-4 w-4 mr-2" />
                {message.is_pinned ? 'Desafixar' : 'Fixar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(message.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTimeout(message.user_id)}>
                <Timer className="h-4 w-4 mr-2" />
                Timeout 5min
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onBan(message.user_id)}
                className="text-red-500 focus:text-red-500"
              >
                <Ban className="h-4 w-4 mr-2" />
                Banir
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
export function LiveChatPanel({ liveId, className, compact = false }: LiveChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAutoScrolling = useRef(true);

  const {
    state,
    sendMessage,
    rateLimit,
    moderation,
    loadMoreMessages,
    isModerator,
    isAdmin,
    reconnect,
  } = useLiveChat(liveId);

  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (isAutoScrolling.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages]);

  // Handler de scroll para detectar se usuário está no fundo
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    isAutoScrolling.current = isAtBottom;
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

  // Ações de moderação
  const handleDelete = useCallback((messageId: string) => {
    moderation.deleteMessage(messageId);
  }, [moderation]);

  const handleTimeout = useCallback((userId: string) => {
    moderation.timeoutUser(userId, 5 * 60 * 1000, 'Timeout por moderador');
  }, [moderation]);

  const handleBan = useCallback((userId: string) => {
    moderation.banUser(userId, 'Banido por moderador');
  }, [moderation]);

  const handlePin = useCallback((messageId: string) => {
    // TODO: Implementar pin/unpin
    console.log('Pin:', messageId);
  }, []);

  // Calcular tempo restante de cooldown
  const cooldownSeconds = Math.ceil(rateLimit.state.cooldownRemaining / 1000);
  const canSend = rateLimit.state.canSend && inputValue.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden",
        "bg-gradient-to-b from-black/60 to-black/80",
        "backdrop-blur-xl border border-white/10",
        "shadow-2xl shadow-black/50",
        compact ? "h-[400px]" : "h-[600px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">Chat ao Vivo</span>
          {state.isSlowMode && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Slow Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Contador de viewers */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-sm text-white/60">
                <Users className="h-4 w-4" />
                <span>{state.viewerCount.toLocaleString()}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {state.viewerCount} espectadores online
            </TooltipContent>
          </Tooltip>

          {/* Status de conexão */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                {state.isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={reconnect}
                  >
                    <WifiOff className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {state.isConnected ? 'Conectado' : 'Desconectado - Clique para reconectar'}
            </TooltipContent>
          </Tooltip>

          {/* Controles de moderação */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Shield className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={moderation.enableGlobalSlowMode}>
                  <Clock className="h-4 w-4 mr-2" />
                  Ativar Slow Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={moderation.disableGlobalSlowMode}>
                  <Zap className="h-4 w-4 mr-2" />
                  Desativar Slow Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={moderation.clearChat}
                  className="text-red-500 focus:text-red-500"
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
            className="border-b border-amber-500/30 bg-amber-500/10"
          >
            <div className="px-4 py-2 flex items-start gap-2">
              <Pin className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-amber-400 text-sm">
                  {state.pinnedMessage.user_name}:
                </span>
                <p className="text-sm text-white/80 truncate">
                  {state.pinnedMessage.content}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área de mensagens */}
      <ScrollArea 
        ref={scrollRef}
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        {/* Carregar mais */}
        {state.messages.length >= 50 && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMoreMessages}
              className="text-xs text-white/50 hover:text-white"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Carregar anteriores
            </Button>
          </div>
        )}

        {/* Loading */}
        {state.isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Mensagens */}
        <AnimatePresence mode="popLayout">
          {state.messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isModerator={isModerator}
              onDelete={handleDelete}
              onTimeout={handleTimeout}
              onBan={handleBan}
              onPin={handlePin}
            />
          ))}
        </AnimatePresence>

        {/* Sem mensagens */}
        {!state.isLoading && state.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs">Seja o primeiro a comentar!</p>
          </div>
        )}
      </ScrollArea>

      {/* Erro */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-red-500/20 border-t border-red-500/30"
          >
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {state.error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        {/* Cooldown indicator */}
        {!rateLimit.state.canSend && (
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
            <Clock className="h-3 w-3" />
            Aguarde {cooldownSeconds}s para enviar outra mensagem
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              rateLimit.state.isTimedOut 
                ? "Você está em timeout..." 
                : "Digite sua mensagem..."
            }
            disabled={rateLimit.state.isTimedOut || !state.isConnected}
            maxLength={rateLimit.config.maxChars}
            className={cn(
              "flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40",
              "focus:ring-primary/50 focus:border-primary/50",
              "rounded-xl"
            )}
          />
          
          <Button
            onClick={handleSend}
            disabled={!canSend || rateLimit.state.isTimedOut || !state.isConnected}
            className={cn(
              "rounded-xl bg-gradient-to-r from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "disabled:opacity-50"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Contador de caracteres */}
        <div className="flex justify-end mt-1">
          <span className={cn(
            "text-[10px]",
            inputValue.length > rateLimit.config.maxChars * 0.9 
              ? "text-red-400" 
              : "text-white/30"
          )}>
            {inputValue.length}/{rateLimit.config.maxChars}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(LiveChatPanel);
