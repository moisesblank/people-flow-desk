// ============================================
// MASTER PRO ULTRA v3.0 - LIVE CHAT COMPONENT
// Chat em tempo real para 5.000+ usuários
// ============================================

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useLiveClass } from '@/hooks/useLiveClass';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Heart, ThumbsUp, Laugh, Flame, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para novas mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-background/95 backdrop-blur rounded-lg border border-border/50',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <h3 className="font-semibold text-sm">Chat ao Vivo</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="font-medium">{viewers.toLocaleString()}</span>
          <span className={cn(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          )} />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">
              Seja o primeiro a enviar uma mensagem!
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-2 items-start">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={msg.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {msg.user_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-xs text-primary">
                    {msg.user_name}
                  </span>
                  <p className="text-sm text-foreground break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Reactions floating */}
      <div className="absolute right-4 bottom-32 pointer-events-none overflow-hidden h-40">
        {reactions.map((reaction) => {
          const ReactionIcon = REACTIONS.find(r => r.type === reaction.type)?.icon || Heart;
          const color = REACTIONS.find(r => r.type === reaction.type)?.color || 'text-red-500';

          return (
            <div
              key={reaction.id}
              className={cn('absolute animate-bounce', color)}
              style={{
                bottom: 0,
                right: Math.random() * 40,
                animation: 'float-up 3s ease-out forwards',
                opacity: 0.8
              }}
            >
              <ReactionIcon className="w-6 h-6 drop-shadow-lg" fill="currentColor" />
            </div>
          );
        })}
      </div>

      {/* Reaction buttons */}
      <div className="flex justify-center gap-1 p-2 border-t border-border/50">
        {REACTIONS.map(({ type, icon: Icon, color, hoverBg }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => sendReaction(type)}
            className={cn('h-8 w-8 p-0 transition-transform hover:scale-110', color, hoverBg)}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-border/50">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          className="flex-1 h-9 text-sm"
          maxLength={200}
          disabled={!isConnected}
        />
        <Button 
          onClick={handleSend} 
          size="sm" 
          className="h-9 w-9 p-0"
          disabled={!isConnected || !newMessage.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* CSS para animação */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-150px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
