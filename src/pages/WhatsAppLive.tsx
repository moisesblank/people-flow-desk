import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Search, Phone, MessageSquare, Send, User, Clock, RefreshCw, 
  Zap, Bot, Crown, MessageCircle, CheckCheck, Star, Users, 
  TrendingUp, Activity, Wifi, WifiOff
} from 'lucide-react';

// ==============================================================================
// TIPOS
// ==============================================================================
interface Conversation {
  id: string;
  phone: string;
  display_name: string | null;
  owner_detected: boolean;
  owner_name: string | null;
  session_mode: string;
  last_message_at: string | null;
  unread_count: number;
  crm_stage: string;
  status: string;
  notes: string | null;
  tags: string[] | null;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: string;
  message_id: string;
  message_type: string;
  message_text: string | null;
  from_phone: string;
  to_phone: string;
  timestamp: string;
  handled_by: string;
}

// ==============================================================================
// COMPONENTE PRINCIPAL - WHATSAPP LIVE
// ==============================================================================
export default function WhatsAppLive() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // ==============================================================================
  // QUERIES
  // ==============================================================================
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['whatsapp-live-conversations'],
    queryFn: async () => {
      // ⚡ DOGMA V.5K: Limite + polling otimizado
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Conversation[];
    },
    refetchInterval: 30000 // ⚡ DOGMA V.5K: 30s (de 5s) - usar Realtime para atualizações críticas
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['whatsapp-live-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      // ⚡ DOGMA V.5K: Limite + polling otimizado
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('timestamp', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation,
    refetchInterval: 15000 // ⚡ DOGMA V.5K: 15s (de 3s) - usar Realtime para mensagens novas
  });

  // Stats em tempo real
  const { data: stats } = useQuery({
    queryKey: ['whatsapp-live-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [msgsResult, convsResult, leadsResult] = await Promise.all([
        supabase.from('whatsapp_messages').select('id', { count: 'exact' }).gte('created_at', today),
        supabase.from('whatsapp_conversations').select('id', { count: 'exact' }).eq('status', 'open'),
        supabase.from('whatsapp_leads').select('id', { count: 'exact' }).gte('created_at', today)
      ]);

      return {
        mensagensHoje: msgsResult.count || 0,
        conversasAbertas: convsResult.count || 0,
        novosLeads: leadsResult.count || 0
      };
    },
    refetchInterval: 60000 // ⚡ DOGMA V.5K: 60s (de 10s)
  });

  // ==============================================================================
  // REALTIME SUBSCRIPTION
  // ==============================================================================
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-live-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-live-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['whatsapp-live-stats'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-live-messages'] });
        queryClient.invalidateQueries({ queryKey: ['whatsapp-live-stats'] });
        
        // Notificação de nova mensagem
        if (payload.new && (payload.new as any).direction === 'inbound') {
          toast.info('Nova mensagem recebida!', {
            description: 'Uma nova mensagem chegou no WhatsApp'
          });
        }
        
        // Auto-scroll
        if (payload.new && (payload.new as any).conversation_id === selectedConversation) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [queryClient, selectedConversation]);

  // Auto-scroll ao mudar de conversa
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [selectedConversation, messages.length]);

  // ==============================================================================
  // ENVIAR MENSAGEM
  // ==============================================================================
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !selectedConv) return;
    
    setSendingMessage(true);
    try {
      const { error: insertError } = await supabase.from('whatsapp_messages').insert({
        conversation_id: selectedConversation,
        direction: 'outbound',
        message_id: `manual_${Date.now()}`,
        message_type: 'text',
        message_text: messageInput.trim(),
        from_phone: 'system',
        to_phone: selectedConv.phone,
        handled_by: 'manual_live_panel',
        timestamp: new Date().toISOString()
      });
      
      if (insertError) throw insertError;
      
      await supabase.from('whatsapp_conversations').update({
        last_message_at: new Date().toISOString()
      }).eq('id', selectedConversation);
      
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-live-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-live-conversations'] });
      
      toast.success('Mensagem enviada!');
      
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      toast.error('Erro ao enviar mensagem', { description: error.message });
    } finally {
      setSendingMessage(false);
    }
  };

  // ==============================================================================
  // HELPERS
  // ==============================================================================
  const filteredConversations = conversations.filter((c) => {
    return c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.phone?.includes(searchTerm);
  });

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const getMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, msg) => {
    const date = getMessageDate(msg.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <>
      <Helmet>
        <title>WhatsApp LIVE | Gestão Moisés Medeiros</title>
        <meta name="description" content="Central WhatsApp em tempo real" />
      </Helmet>

      <div className="h-[calc(100vh-80px)] flex flex-col bg-background">
        {/* Header com Stats */}
        <div className="p-4 border-b bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-teal-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                  <Phone className="h-6 w-6 text-green-500" />
                </div>
                <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  WhatsApp LIVE
                  <Badge variant="outline" className={`${isConnected ? 'text-green-500 border-green-500/50' : 'text-red-500 border-red-500/50'}`}>
                    {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground">Atualização em tempo real</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{stats?.mensagensHoje || 0}</span>
                <span className="text-xs text-muted-foreground">hoje</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Users className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">{stats?.conversasAbertas || 0}</span>
                <span className="text-xs text-muted-foreground">abertas</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">{stats?.novosLeads || 0}</span>
                <span className="text-xs text-muted-foreground">leads</span>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => queryClient.invalidateQueries()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lista de Conversas */}
          <div className="w-80 border-r flex flex-col bg-card">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <AnimatePresence>
                {loadingConversations ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Carregando...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Nenhuma conversa</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">As conversas aparecerão aqui em tempo real</p>
                  </div>
                ) : (
                  filteredConversations.map((conv, index) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-3 cursor-pointer border-b transition-colors hover:bg-accent/50 ${
                        selectedConversation === conv.id ? 'bg-accent border-l-2 border-l-green-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                            {conv.display_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                          </div>
                          {conv.owner_detected && (
                            <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                              {conv.display_name || conv.phone}
                            </span>
                            {conv.unread_count > 0 && (
                              <Badge className="bg-green-500 text-white text-xs">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {conv.last_message_at 
                              ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })
                              : 'Sem mensagens'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </ScrollArea>
          </div>

          {/* Área de Chat */}
          <div className="flex-1 flex flex-col bg-background">
            {selectedConv ? (
              <>
                {/* Header da Conversa */}
                <div className="p-4 border-b bg-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                      {selectedConv.display_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {selectedConv.display_name || selectedConv.phone}
                        {selectedConv.owner_detected && (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedConv.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={selectedConv.status === 'open' ? 'text-green-500' : ''}>
                      {selectedConv.status === 'open' ? 'Aberta' : 'Fechada'}
                    </Badge>
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/20">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : Object.keys(groupedMessages).length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                      </div>
                    </div>
                  ) : (
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                      <div key={date}>
                        <div className="flex justify-center my-4">
                          <Badge variant="secondary" className="text-xs">
                            {date}
                          </Badge>
                        </div>
                        {msgs.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex mb-3 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                                msg.direction === 'outbound'
                                  ? 'bg-green-500 text-white rounded-br-none'
                                  : 'bg-card border rounded-bl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                msg.direction === 'outbound' ? 'text-green-100' : 'text-muted-foreground'
                              }`}>
                                <span>{format(new Date(msg.timestamp), 'HH:mm')}</span>
                                {msg.direction === 'outbound' && <CheckCheck className="h-3 w-3" />}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input de Mensagem */}
                <div className="p-4 border-t bg-card">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                      disabled={sendingMessage}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sendingMessage || !messageInput.trim()}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="p-6 rounded-full bg-green-500/10 w-fit mx-auto mb-4">
                    <MessageSquare className="h-12 w-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">WhatsApp LIVE</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Selecione uma conversa para ver as mensagens em tempo real
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                    Atualizando automaticamente...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}