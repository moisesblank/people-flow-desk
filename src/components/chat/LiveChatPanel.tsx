// ============================================
// MASTER PRO ULTRA v3.0 - LIVE CHAT PANEL
// Componente futurista de chat para lives
// ============================================

import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MessageSquare, Loader2, AlertCircle, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLiveChat, ChatMessage } from '@/hooks/useLiveChat';
import { cn } from '@/lib/utils';

interface LiveChatPanelProps {
  liveId: string;
  className?: string;
  maxHeight?: string;
  showViewerCount?: boolean;
  isModerator?: boolean;
}

// Componente de mensagem memoizado para performance
const ChatMessageItem = memo(({ 
  message, 
  isModerator,
  onHighlight,
  onDelete,
}: { 
  message: ChatMessage;
  isModerator?: boolean;
  onHighlight?: (id: string) => void;
  onDelete?: (id: string) => void;
}) => {
  const initials = message.userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'group flex items-start gap-2 p-2 rounded-lg transition-colors',
        message.isHighlighted && 'bg-primary/10 border border-primary/30',
        'hover:bg-muted/50'
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.avatarUrl} alt={message.userName} />
        <AvatarFallback className="text-xs bg-primary/20">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">
            {message.userName}
          </span>
          {message.isModerator && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              MOD
            </Badge>
          )}
          {message.isHighlighted && (
            <Star className="h-3 w-3 text-primary fill-primary" />
          )}
        </div>
        <p className="text-sm text-muted-foreground break-words">
          {message.message}
        </p>
      </div>

      {isModerator && (
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onHighlight?.(message.id)}
          >
            <Star className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onDelete?.(message.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </motion.div>
  );
});

ChatMessageItem.displayName = 'ChatMessageItem';

export function LiveChatPanel({
  liveId,
  className,
  maxHeight = '500px',
  showViewerCount = true,
  isModerator = false,
}: LiveChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isConnected,
    isLoading,
    error,
    viewerCount,
    isSending,
    cooldownSeconds,
    sendMessage,
    highlightMessage,
    deleteMessage,
  } = useLiveChat({ liveId });

  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending || cooldownSeconds > 0) return;

    const success = await sendMessage(inputValue.trim());
    if (success) {
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const canSend = inputValue.trim().length > 0 && !isSending && cooldownSeconds === 0;

  return (
    <div className={cn('flex flex-col bg-card rounded-xl border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="font-semibold">Chat ao Vivo</span>
        </div>
        
        <div className="flex items-center gap-3">
          {showViewerCount && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{viewerCount}</span>
            </div>
          )}
          
          <div className={cn(
            'h-2 w-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          )} />
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea 
        ref={scrollRef}
        className="flex-1 p-2"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
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
                onHighlight={highlightMessage}
                onDelete={deleteMessage}
              />
            ))}
          </AnimatePresence>
        )}
      </ScrollArea>

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
      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                cooldownSeconds > 0 
                  ? `Aguarde ${cooldownSeconds}s...` 
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
            type="submit" 
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
      </form>
    </div>
  );
}

export default LiveChatPanel;
