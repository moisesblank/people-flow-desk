// ============================================
// SYNAPSE v14.0 - CHAT INTERNO DA EQUIPE
// Sistema de mensagens em tempo real
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Users,
  Smile,
  Paperclip,
  MoreVertical,
  Reply,
  Trash2,
  Check,
  CheckCheck,
  Loader2,
  X,
  Search,
  Bell,
  BellOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  attachments: any[];
  reply_to: string | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    nome: string;
    avatar_url: string;
    email: string;
  };
}

interface TeamChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamChat({ isOpen, onClose }: TeamChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      subscribeToMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("team_chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, avatar_url, email")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const messagesWithSenders = data?.map(m => ({
        ...m,
        sender: profileMap.get(m.sender_id)
      })) || [];

      setMessages(messagesWithSenders as ChatMessage[]);

      // Mark messages as read
      if (user && data?.length) {
        const unreadIds = data.filter(m => !m.is_read && m.sender_id !== user.id).map(m => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("team_chat_messages")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("team_chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_chat_messages"
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, nome, avatar_url, email")
            .eq("id", newMsg.sender_id)
            .single();

          const messageWithSender = {
            ...newMsg,
            sender: profile || undefined
          };

          setMessages(prev => [...prev, messageWithSender as ChatMessage]);

          // Show notification if not from current user
          if (newMsg.sender_id !== user?.id && notificationsEnabled) {
            toast.info(`${profile?.nome || "Alguém"}: ${newMsg.content.substring(0, 50)}...`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("team_chat_messages")
        .insert({
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: "text",
          reply_to: replyTo?.id || null
        });

      if (error) throw error;

      setNewMessage("");
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("team_chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", user?.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Mensagem excluída");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Erro ao excluir mensagem");
    }
  };

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return `Ontem ${format(d, "HH:mm")}`;
    return format(d, "dd/MM HH:mm", { locale: ptBR });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Chat da Equipe</h3>
              <p className="text-xs text-muted-foreground">
                {messages.length} mensagens
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 border-b border-border"
            >
              <Input
                placeholder="Buscar mensagens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
              <p className="text-sm text-muted-foreground">Comece uma conversa!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showAvatar = index === 0 || 
                  filteredMessages[index - 1]?.sender_id !== message.sender_id;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(message.sender?.nome || "?")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                      {showAvatar && !isOwn && (
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {message.sender?.nome}
                        </p>
                      )}

                      {/* Reply reference */}
                      {message.reply_to && (
                        <div className="text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded mb-1 border-l-2 border-primary">
                          Em resposta a uma mensagem
                        </div>
                      )}

                      <div className="group relative">
                        <div 
                          className={`px-3 py-2 rounded-2xl ${
                            isOwn 
                              ? "bg-primary text-primary-foreground rounded-tr-sm" 
                              : "bg-secondary/50 rounded-tl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>

                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
                          <span className="text-[10px] text-muted-foreground">
                            {formatMessageTime(message.created_at)}
                          </span>
                          {isOwn && (
                            message.is_read 
                              ? <CheckCheck className="h-3 w-3 text-primary" />
                              : <Check className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>

                        {/* Actions */}
                        <div className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setReplyTo(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Responder
                              </DropdownMenuItem>
                              {isOwn && (
                                <DropdownMenuItem 
                                  onClick={() => deleteMessage(message.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 border-t border-border bg-secondary/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Respondendo a <strong>{replyTo.sender?.nome}</strong>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {replyTo.content}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
