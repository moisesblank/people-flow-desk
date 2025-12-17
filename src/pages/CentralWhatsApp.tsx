import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, Phone, MessageSquare, Paperclip, Image, FileText, Video, Music, 
  Send, User, Clock, Star, Filter, Archive, Users, Download, ExternalLink,
  CheckCheck, Check, Mic, MapPin, File, Play, Pause, MoreVertical,
  Plus, ListTodo, DollarSign, Tag, X, RefreshCw, Zap, Bot, Crown,
  Calendar, TrendingUp, AlertCircle, CircleDot, MessageCircle
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

interface Attachment {
  id: string;
  message_id: string;
  conversation_id: string;
  attachment_type: string;
  mime_type: string | null;
  storage_path: string | null;
  public_url: string | null;
  file_size: number | null;
  filename: string | null;
  caption: string | null;
  download_status: string;
}

// ==============================================================================
// COMPONENTE PRINCIPAL
// ==============================================================================
const CentralWhatsApp = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showFinanceDialog, setShowFinanceDialog] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // ==============================================================================
  // QUERIES
  // ==============================================================================
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    }
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['whatsapp-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ['whatsapp-attachments', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from('whatsapp_attachments')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Attachment[];
    },
    enabled: !!selectedConversation
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMsgs } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .gte('created_at', today);
      
      const { data: tasks } = await supabase
        .from('command_tasks')
        .select('id')
        .eq('status', 'todo');

      const { data: finance } = await supabase
        .from('command_finance')
        .select('amount, type')
        .eq('status', 'open');

      const totalPayable = finance?.filter(f => f.type === 'payable').reduce((s, f) => s + f.amount, 0) || 0;

      return {
        messagesHoje: todayMsgs?.length || 0,
        tarefasPendentes: tasks?.length || 0,
        aPagar: totalPayable
      };
    }
  });

  // ==============================================================================
  // REALTIME
  // ==============================================================================
  useEffect(() => {
    const channel = supabase
      .channel('central-whatsapp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
        queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
        // Auto-scroll para nova mensagem
        if (payload.new && (payload.new as any).conversation_id === selectedConversation) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_attachments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-attachments'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient, selectedConversation]);

  // Auto-scroll ao mudar de conversa
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [selectedConversation, messages.length]);

  // ==============================================================================
  // MUTATIONS
  // ==============================================================================
  const updateConversation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Conversation> }) => {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update(data.updates)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      toast.success('Conversa atualizada!');
    }
  });

  const createTask = useMutation({
    mutationFn: async (data: { title: string; description?: string; priority: string }) => {
      const { error } = await supabase.from('command_tasks').insert({
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'todo',
        source: 'ui',
        related_conversation_id: selectedConversation
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
      toast.success('Tarefa criada!');
      setShowTaskDialog(false);
    }
  });

  const createFinance = useMutation({
    mutationFn: async (data: { amount: number; type: string; description: string; counterparty?: string }) => {
      const { error } = await supabase.from('command_finance').insert({
        amount: data.amount,
        type: data.type,
        description: data.description,
        counterparty: data.counterparty,
        status: 'open',
        source: 'ui',
        related_conversation_id: selectedConversation
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
      toast.success('Lançamento criado!');
      setShowFinanceDialog(false);
    }
  });

  // ==============================================================================
  // ENVIAR MENSAGEM
  // ==============================================================================
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !selectedConv) return;
    
    setSendingMessage(true);
    try {
      // Salvar mensagem no banco (outbound)
      const { error: insertError } = await supabase.from('whatsapp_messages').insert({
        conversation_id: selectedConversation,
        direction: 'outbound',
        message_id: `manual_${Date.now()}`,
        message_type: 'text',
        message_text: messageInput.trim(),
        from_phone: 'system',
        to_phone: selectedConv.phone,
        handled_by: 'manual_panel',
        timestamp: new Date().toISOString()
      });
      
      if (insertError) throw insertError;
      
      // Atualizar conversa
      await supabase.from('whatsapp_conversations').update({
        last_message_at: new Date().toISOString()
      }).eq('id', selectedConversation);
      
      // Limpar input e atualizar queries
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      
      toast.success('Mensagem salva!', {
        description: 'Nota: O envio real via WhatsApp API requer configuração adicional.'
      });
      
      // Scroll para nova mensagem
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
    const matchesSearch = 
      c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const getMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4 text-blue-500" />;
      case 'video': return <Video className="h-4 w-4 text-purple-500" />;
      case 'audio': return <Mic className="h-4 w-4 text-green-500" />;
      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'sticker': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'location': return <MapPin className="h-4 w-4 text-red-500" />;
      default: return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCRMBadge = (stage: string) => {
    const variants: Record<string, string> = {
      lead: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      prospect: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      customer: 'bg-green-500/10 text-green-500 border-green-500/20',
      vip: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return variants[stage] || 'bg-muted text-muted-foreground';
  };

  // Agrupar mensagens por data
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, msg) => {
    const date = getMessageDate(msg.timestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <>
      <Helmet>
        <title>Central WhatsApp | Gestão Moisés Medeiros</title>
        <meta name="description" content="Centro de comando WhatsApp em tempo real" />
      </Helmet>

      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Header com Stats */}
        <div className="p-4 border-b bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <MessageSquare className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Central WhatsApp</h1>
                <p className="text-sm text-muted-foreground">Centro de Comando em Tempo Real</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{stats?.messagesHoje || 0} hoje</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
                <ListTodo className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{stats?.tarefasPendentes || 0} tarefas</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
                <DollarSign className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">R$ {(stats?.aPagar || 0).toLocaleString('pt-BR')}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Lista de Conversas */}
          <div className="w-80 border-r flex flex-col bg-card">
            <div className="p-3 space-y-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('all')}
                  className="flex-1 text-xs"
                >
                  Tudo
                </Button>
                <Button 
                  variant={statusFilter === 'open' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('open')}
                  className="flex-1 text-xs"
                >
                  Abertas
                </Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('pending')}
                  className="flex-1 text-xs"
                >
                  Pendentes
                </Button>
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
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhuma conversa encontrada
                  </div>
                ) : (
                  filteredConversations.map((conv, index) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-3 border-b cursor-pointer transition-all hover:bg-muted/50 ${
                        selectedConversation === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          conv.owner_detected ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-green-500/20'
                        }`}>
                          {conv.owner_detected ? (
                            <Crown className="h-5 w-5 text-white" />
                          ) : (
                            <User className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate text-sm">
                              {conv.display_name || conv.phone}
                            </span>
                            {conv.unread_count > 0 && (
                              <Badge className="bg-green-500 text-white text-xs h-5 min-w-5 flex items-center justify-center">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.phone}
                          </p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {conv.session_mode === 'ASSISTOR_ON' && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-500">
                                <Bot className="h-2.5 w-2.5 mr-0.5" />
                                ON
                              </Badge>
                            )}
                            {conv.owner_detected && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {conv.owner_name}
                              </Badge>
                            )}
                            {conv.crm_stage && conv.crm_stage !== 'lead' && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getCRMBadge(conv.crm_stage)}`}>
                                {conv.crm_stage.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {conv.last_message_at && format(new Date(conv.last_message_at), 'HH:mm')}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </ScrollArea>
          </div>

          {/* Thread de Mensagens */}
          <div className="flex-1 flex flex-col bg-muted/30">
            {selectedConv ? (
              <>
                {/* Header da conversa */}
                <div className="p-3 border-b bg-card/95 backdrop-blur flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedConv.owner_detected ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-green-500/20'
                    }`}>
                      {selectedConv.owner_detected ? (
                        <Crown className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold">{selectedConv.display_name || selectedConv.phone}</h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {selectedConv.phone}
                        {selectedConv.session_mode === 'ASSISTOR_ON' && (
                          <Badge className="text-[10px] bg-green-500">Modo Assessor</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Dialog Criar Tarefa */}
                    <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ListTodo className="h-4 w-4 mr-1" />
                          Tarefa
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Tarefa</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          createTask.mutate({
                            title: formData.get('title') as string,
                            description: formData.get('description') as string,
                            priority: formData.get('priority') as string
                          });
                        }} className="space-y-4">
                          <div>
                            <Label>Título</Label>
                            <Input name="title" required placeholder="Ex: Ligar para cliente" />
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <Textarea name="description" placeholder="Detalhes..." />
                          </div>
                          <div>
                            <Label>Prioridade</Label>
                            <Select name="priority" defaultValue="med">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="med">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" className="w-full">Criar Tarefa</Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {/* Dialog Lançar Finança */}
                    <Dialog open={showFinanceDialog} onOpenChange={setShowFinanceDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Finança
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Lançar Finança</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          createFinance.mutate({
                            amount: parseFloat(formData.get('amount') as string),
                            type: formData.get('type') as string,
                            description: formData.get('description') as string,
                            counterparty: formData.get('counterparty') as string
                          });
                        }} className="space-y-4">
                          <div>
                            <Label>Valor (R$)</Label>
                            <Input name="amount" type="number" step="0.01" required placeholder="0,00" />
                          </div>
                          <div>
                            <Label>Tipo</Label>
                            <Select name="type" defaultValue="expense">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">Receita</SelectItem>
                                <SelectItem value="expense">Despesa</SelectItem>
                                <SelectItem value="payable">A Pagar</SelectItem>
                                <SelectItem value="receivable">A Receber</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <Input name="description" required placeholder="Ex: Pagamento de curso" />
                          </div>
                          <div>
                            <Label>Contraparte</Label>
                            <Input name="counterparty" placeholder="Nome do cliente/fornecedor" />
                          </div>
                          <Button type="submit" className="w-full">Lançar</Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Select 
                      value={selectedConv.crm_stage} 
                      onValueChange={(value) => updateConversation.mutate({ id: selectedConv.id, updates: { crm_stage: value } })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="CRM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Cliente</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {loadingMessages ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                      </div>
                    ) : (
                      Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="flex justify-center mb-3">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {date}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {msgs.map((msg) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                                    msg.direction === 'outbound'
                                      ? 'bg-green-500 text-white rounded-br-md'
                                      : 'bg-card border rounded-bl-md'
                                  }`}
                                >
                                  {msg.message_type !== 'text' && (
                                    <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                                      {getAttachmentIcon(msg.message_type)}
                                      <span>{msg.message_type}</span>
                                    </div>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {msg.message_text || '[Mídia]'}
                                  </p>
                                  <div className={`flex items-center justify-end gap-1 mt-1 ${
                                    msg.direction === 'outbound' ? 'text-white/70' : 'text-muted-foreground'
                                  }`}>
                                    <span className="text-[10px]">
                                      {format(new Date(msg.timestamp), 'HH:mm')}
                                    </span>
                                    {msg.direction === 'outbound' && (
                                      <CheckCheck className="h-3 w-3" />
                                    )}
                                    {msg.handled_by === 'chatgpt_tramon' && (
                                      <Bot className="h-3 w-3" />
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

{/* Input de mensagem */}
                <div className="p-3 border-t bg-card">
                  <div className="flex gap-2 items-end max-w-3xl mx-auto">
                    <Textarea
                      placeholder="Digite uma mensagem..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="resize-none min-h-[44px] max-h-32"
                      rows={1}
                    />
                    <Button 
                      className="shrink-0 bg-green-500 hover:bg-green-600"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
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
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-green-500 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium">Central WhatsApp</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Selecione uma conversa para visualizar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Painel de Detalhes */}
          {selectedConv && (
            <div className="w-80 border-l bg-card flex flex-col">
              <Tabs defaultValue="info" className="flex-1 flex flex-col">
                <div className="p-2 border-b">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                    <TabsTrigger value="anexos" className="text-xs">
                      Anexos ({attachments.length})
                    </TabsTrigger>
                    <TabsTrigger value="acoes" className="text-xs">Ações</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="info" className="flex-1 p-4 m-0 overflow-auto">
                  <div className="space-y-4">
                    <div className="text-center pb-4 border-b">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                        selectedConv.owner_detected ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-green-500/20'
                      }`}>
                        {selectedConv.owner_detected ? (
                          <Crown className="h-8 w-8 text-white" />
                        ) : (
                          <User className="h-8 w-8 text-green-600" />
                        )}
                      </div>
                      <h3 className="font-semibold mt-2">{selectedConv.display_name || 'Sem nome'}</h3>
                      <p className="text-sm text-muted-foreground">{selectedConv.phone}</p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select 
                        value={selectedConv.status} 
                        onValueChange={(value) => updateConversation.mutate({ id: selectedConv.id, updates: { status: value } })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberta</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="closed">Fechada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Estágio CRM</Label>
                      <Badge variant="outline" className={`mt-1 ${getCRMBadge(selectedConv.crm_stage)}`}>
                        {selectedConv.crm_stage?.toUpperCase() || 'LEAD'}
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Notas</Label>
                      <Textarea
                        className="mt-1 text-sm"
                        placeholder="Adicione notas sobre este contato..."
                        value={selectedConv.notes || ''}
                        onChange={(e) => updateConversation.mutate({ 
                          id: selectedConv.id, 
                          updates: { notes: e.target.value } 
                        })}
                        rows={3}
                      />
                    </div>

                    {selectedConv.session_mode === 'ASSISTOR_ON' && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">Modo Assessor Ativo</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          ChatGPT TRAMON está respondendo
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="anexos" className="flex-1 p-4 m-0 overflow-auto">
                  <div className="space-y-2">
                    {attachments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sem anexos</p>
                      </div>
                    ) : (
                      attachments.map((att) => (
                        <div 
                          key={att.id} 
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            {getAttachmentIcon(att.attachment_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {att.filename || `${att.attachment_type}.${att.mime_type?.split('/')[1] || 'file'}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {att.file_size ? `${Math.round(att.file_size / 1024)}KB` : 'Tamanho desconhecido'}
                              {att.caption && ` • ${att.caption}`}
                            </p>
                          </div>
                          {att.public_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={att.public_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="acoes" className="flex-1 p-4 m-0 overflow-auto">
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setShowTaskDialog(true)}
                    >
                      <ListTodo className="h-4 w-4 mr-2" />
                      Criar Tarefa
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setShowFinanceDialog(true)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Lançar Finança
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => updateConversation.mutate({ 
                        id: selectedConv.id, 
                        updates: { crm_stage: 'vip' } 
                      })}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Marcar como VIP
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => updateConversation.mutate({ 
                        id: selectedConv.id, 
                        updates: { status: 'closed' } 
                      })}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar Conversa
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => updateConversation.mutate({ 
                        id: selectedConv.id, 
                        updates: { session_mode: 'ASSISTOR_OFF' } 
                      })}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Encerrar Sessão
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CentralWhatsApp;
