// ============================================
// 🔥 PROVA DE FOGO 5.000 SIMULTÂNEOS
// Chat em tempo real OTIMIZADO para alta escala
// ANO 2300 - MATRIZ DIGITAL SUPREMA
// ============================================

import { useState, useRef, useEffect, KeyboardEvent, memo, useCallback } from 'react';
import { useLiveClass } from '@/hooks/useLiveClass';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { formatError } from '@/lib/utils/formatError';
import { 
  Send, 
  Heart, 
  ThumbsUp, 
  Laugh, 
  Flame, 
  Users, 
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { LIVE_5K_CONFIG, LiveMessage, LiveReaction } from '@/config/performance-5k';

interface LiveChatProps {
  classId: string;
  className?: string;
}

const REACTIONS = [
  { type: 'heart' as const, icon: Heart, color: 'text-red-500', hoverBg: 'hover:bg-red-500/10' },
  { type: 'like' as const, icon: ThumbsUp, color: 'text-blue-500', hoverBg: 'hover:bg-blue-500/10' },
  { type: 'laugh' as const, icon: Laugh, color: 'text-yellow-500', hoverBg: 'hover:bg-yellow-500/10' },
  { type: 'fire' as const, icon: Flame, color: 'text-orange-500', hoverBg: 'hover:bg-orange-500/10' },
];

// ============================================
// COMPONENTE DE MENSAGEM (memoizado)
// ============================================
const ChatMessage = memo(({ msg }: { msg: LiveMessage }) => (
  <motion.div 
    className="flex gap-2 items-start"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.15 }}
  >
    <Avatar className="w-6 h-6 flex-shrink-0">
      <AvatarImage src={msg.avatar_url} />
      <AvatarFallback className="text-xs bg-primary/20 text-primary">
        {msg.user_name[0]?.toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <span className={cn(
        "font-medium text-xs",
        msg.is_moderator ? "text-yellow-500" : "text-primary"
      )}>
        {msg.user_name}
        {msg.is_moderator && <span className="ml-1 text-[10px]">⭐</span>}
      </span>
      <p className="text-sm text-foreground break-words leading-tight">
        {msg.message}
      </p>
    </div>
  </motion.div>
));

ChatMessage.displayName = 'ChatMessage';

// ============================================
// COMPONENTE DE REACTION FLOATING
// ============================================
const FloatingReaction = memo(({ reaction }: { reaction: LiveReaction }) => {
  const ReactionIcon = REACTIONS.find(r => r.type === reaction.type)?.icon || Heart;
  const color = REACTIONS.find(r => r.type === reaction.type)?.color || 'text-red-500';

  return (
    <motion.div
      className={cn('absolute', color)}
      style={{
        bottom: 0,
        right: Math.random() * 40,
      }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -150, opacity: 0, scale: 0.5 }}
      transition={{ duration: 3, ease: 'easeOut' }}
    >
      <ReactionIcon className="w-6 h-6 drop-shadow-lg" fill="currentColor" />
    </motion.div>
  );
});

FloatingReaction.displayName = 'FloatingReaction';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function LiveChat({ classId, className }: LiveChatProps) {
  const { 
    viewers, 
    messages, 
    reactions, 
    isConnected, 
    isLoading,
    sendMessage, 
    sendReaction
  } = useLiveClass(classId);
  
  // Compatibilidade: error e rateLimitInfo não existem no hook simplificado
  const error = !isConnected && !isLoading ? 'Desconectado' : null;
  const rateLimitInfo = { canSend: true, waitTime: 0, cooldownSeconds: 0, messagesRemaining: 10 };
  
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  // Auto-scroll para novas mensagens (debounced)
  useEffect(() => {
    if (scrollRef.current && isAutoScrollEnabled) {
      const scrollElement = scrollRef.current;
      // Usar requestAnimationFrame para smooth scroll
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      });
    }
  }, [messages.length, isAutoScrollEnabled]);

  // Detectar se usuário scrollou para cima
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setIsAutoScrollEnabled(isAtBottom);
  }, []);

  const handleSend = useCallback(() => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
      inputRef.current?.focus();
    }
  }, [newMessage, sendMessage]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Calcular progresso do cooldown
  const cooldownProgress = rateLimitInfo.canSend 
    ? 100 
    : Math.max(0, 100 - (rateLimitInfo.cooldownSeconds / (LIVE_5K_CONFIG.CHAT.MIN_MESSAGE_INTERVAL / 1000)) * 100);

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full gap-3', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Conectando ao chat...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full gap-3 p-4', className)}>
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-center text-muted-foreground">{formatError(error)}</p>
        <p className="text-xs text-center text-muted-foreground">
          Se o problema persistir, atualize a página do navegador.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-background/95 backdrop-blur rounded-lg border border-border/50 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Chat ao Vivo</h3>
          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-primary/10">
            5K READY
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="font-medium tabular-nums">{viewers.toLocaleString('pt-BR')}</span>
          <div className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded-full',
            isConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'
          )}>
            {isConnected ? (
              <Wifi className="w-3 h-3 text-emerald-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollRef} 
        className="flex-1 p-3"
        onScroll={handleScroll}
      >
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="w-8 h-8 text-muted-foreground/30 mb-2" />
              </motion.div>
              <p className="text-xs text-muted-foreground">
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))
          )}
        </div>
        
        {/* Indicador de novas mensagens quando scrollado */}
        <AnimatePresence>
          {!isAutoScrollEnabled && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg"
              onClick={() => {
                setIsAutoScrollEnabled(true);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }}
            >
              ↓ Novas mensagens
            </motion.button>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Reactions floating */}
      <div className="absolute right-4 bottom-32 pointer-events-none overflow-hidden h-40 w-16">
        <AnimatePresence mode="popLayout">
          {reactions.map((reaction) => (
            <FloatingReaction key={reaction.id} reaction={reaction as LiveReaction} />
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction buttons */}
      <div className="flex justify-center gap-1 p-2 border-t border-border/50 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
        {REACTIONS.map(({ type, icon: Icon, color, hoverBg }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => sendReaction(type)}
            className={cn('h-8 w-8 p-0 transition-all hover:scale-125', color, hoverBg)}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Rate Limit Indicator */}
      {!rateLimitInfo.canSend && (
        <div className="px-3 py-1 bg-yellow-500/10 border-t border-yellow-500/20">
          <div className="flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Aguarde {rateLimitInfo.cooldownSeconds}s</span>
            </div>
            <span className="text-[10px]">
              {rateLimitInfo.messagesRemaining} msgs restantes
            </span>
          </div>
          <Progress 
            value={cooldownProgress} 
            className="h-1 mt-1 bg-yellow-500/20"
          />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-border/50 bg-gradient-to-r from-transparent via-background to-transparent">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value.slice(0, LIVE_5K_CONFIG.CHAT.MAX_MESSAGE_LENGTH))}
            onKeyPress={handleKeyPress}
            placeholder={
              !isConnected 
                ? "Reconectando..." 
                : !rateLimitInfo.canSend 
                  ? `Aguarde ${rateLimitInfo.cooldownSeconds}s...`
                  : "Digite sua mensagem..."
            }
            className={cn(
              "flex-1 h-9 text-sm pr-12 transition-all",
              !rateLimitInfo.canSend && "opacity-50"
            )}
            maxLength={LIVE_5K_CONFIG.CHAT.MAX_MESSAGE_LENGTH}
            disabled={!isConnected}
          />
          {/* Contador de caracteres */}
          <span className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums",
            newMessage.length > LIVE_5K_CONFIG.CHAT.MAX_MESSAGE_LENGTH * 0.9 
              ? "text-destructive" 
              : "text-muted-foreground"
          )}>
            {newMessage.length}/{LIVE_5K_CONFIG.CHAT.MAX_MESSAGE_LENGTH}
          </span>
        </div>
        <Button 
          onClick={handleSend} 
          size="sm" 
          className={cn(
            "h-9 w-9 p-0 transition-all",
            rateLimitInfo.canSend && newMessage.trim() && "animate-pulse"
          )}
          disabled={!isConnected || !newMessage.trim() || !rateLimitInfo.canSend}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default memo(LiveChat);
