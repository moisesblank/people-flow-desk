import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Phone, MessageSquare, Paperclip, Image, FileText, Video, Music, Send, User, Clock, Star, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet';

const CentralWhatsApp = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const queryClient = useQueryClient();

  // Buscar conversas
  const { data: conversations = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      return data || [];
    }
  });

  // Buscar mensagens da conversa selecionada
  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('timestamp', { ascending: true });
      return data || [];
    },
    enabled: !!selectedConversation
  });

  // Buscar anexos
  const { data: attachments = [] } = useQuery({
    queryKey: ['whatsapp-attachments', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data } = await supabase
        .from('whatsapp_attachments')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedConversation
  });

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_attachments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-attachments'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filteredConversations = conversations.filter((c: any) =>
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const selectedConv = conversations.find((c: any) => c.id === selectedConversation);

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Central WhatsApp | Gestão Moisés Medeiros</title>
      </Helmet>

      <div className="h-[calc(100vh-120px)] flex gap-4 p-4">
        {/* Lista de Conversas */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversas
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {filteredConversations.map((conv: any) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation === conv.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{conv.display_name || conv.phone}</span>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">{conv.unread_count}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground truncate">{conv.phone}</span>
                    <span className="text-xs text-muted-foreground">
                      {conv.last_message_at && format(new Date(conv.last_message_at), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {conv.session_mode === 'ASSISTOR_ON' && (
                      <Badge variant="default" className="text-xs">Assessor ON</Badge>
                    )}
                    {conv.owner_detected && (
                      <Badge variant="secondary" className="text-xs">{conv.owner_name}</Badge>
                    )}
                    {conv.crm_stage === 'vip' && (
                      <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 mr-1" />VIP</Badge>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Thread de Mensagens */}
        <Card className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedConv.display_name || selectedConv.phone}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {selectedConv.phone}
                      {selectedConv.session_mode === 'ASSISTOR_ON' && (
                        <Badge variant="default" className="ml-2">Modo Assessor</Badge>
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.direction === 'outbound'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs opacity-70">
                              {format(new Date(msg.timestamp), 'HH:mm', { locale: ptBR })}
                            </span>
                            {msg.message_type !== 'text' && (
                              <Badge variant="outline" className="text-xs">{msg.message_type}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa</p>
              </div>
            </div>
          )}
        </Card>

        {/* Painel de Detalhes */}
        {selectedConv && (
          <Card className="w-80 flex flex-col">
            <Tabs defaultValue="info" className="flex-1 flex flex-col">
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="anexos">Anexos ({attachments.length})</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <TabsContent value="info" className="p-4 m-0 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <p className="text-sm text-muted-foreground">{selectedConv.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Badge variant={selectedConv.status === 'open' ? 'default' : 'secondary'}>
                      {selectedConv.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Estágio CRM</label>
                    <Badge variant="outline">{selectedConv.crm_stage}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notas</label>
                    <p className="text-sm text-muted-foreground">{selectedConv.notes || 'Sem notas'}</p>
                  </div>
                </TabsContent>
                <TabsContent value="anexos" className="p-4 m-0">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {attachments.map((att: any) => (
                        <div key={att.id} className="flex items-center gap-2 p-2 border rounded">
                          {getAttachmentIcon(att.attachment_type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{att.filename || att.attachment_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {att.file_size ? `${Math.round(att.file_size / 1024)}KB` : 'N/A'}
                            </p>
                          </div>
                          {att.public_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={att.public_url} target="_blank" rel="noopener noreferrer">Ver</a>
                            </Button>
                          )}
                        </div>
                      ))}
                      {attachments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">Sem anexos</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        )}
      </div>
    </>
  );
};

export default CentralWhatsApp;
