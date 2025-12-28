// ============================================
// SEÇÃO COMUNICAÇÃO E SUPORTE DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Mail, Phone, Bell, HelpCircle,
  CheckCircle, Clock, AlertCircle, Users, MessageCircle
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlunoComunicacaoProps {
  userId: string | null;
  alunoEmail: string;
}

export function AlunoPerfilComunicacao({ userId, alunoEmail }: AlunoComunicacaoProps) {
  // Buscar notificações do usuário
  const { data: notifications } = useQuery({
    queryKey: ['aluno-notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!userId
  });

  // Placeholder for support tickets (table doesn't exist yet)
  const supportTickets: any[] = [];

  // Buscar mensagens de chat de livros
  const { data: bookChatMessages } = useQuery({
    queryKey: ['aluno-book-chat', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('book_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar mensagens do live chat
  const { data: liveChatMessages } = useQuery({
    queryKey: ['aluno-live-chat', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!userId
  });

  const totalNotifications = notifications?.length || 0;
  const unreadNotifications = notifications?.filter((n: any) => !n.read)?.length || 0;
  const totalTickets = supportTickets?.length || 0;
  const openTickets = supportTickets?.filter((t: any) => t.status === 'open' || t.status === 'pending')?.length || 0;
  const totalChatMessages = (bookChatMessages?.length || 0) + (liveChatMessages?.length || 0);

  const hasData = totalNotifications > 0 || totalTickets > 0 || totalChatMessages > 0;

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Aberto</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Pendente</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Resolvido</Badge>;
      case 'closed':
        return <Badge className="bg-muted text-muted-foreground">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-pink-500/20">
          <MessageSquare className="h-5 w-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Comunicação & Suporte</h3>
          <p className="text-sm text-muted-foreground">Tickets, notificações, chats e interações</p>
        </div>
      </div>

      {!hasData ? (
        <PresetEmptyState preset="noData" />
      ) : (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Notificações</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalNotifications}</p>
              {unreadNotifications > 0 && (
                <p className="text-xs text-yellow-400">{unreadNotifications} não lidas</p>
              )}
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-muted-foreground">Tickets</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalTickets}</p>
              {openTickets > 0 && (
                <p className="text-xs text-orange-400">{openTickets} abertos</p>
              )}
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">Msgs Chat IA</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{bookChatMessages?.length || 0}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Msgs Live</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{liveChatMessages?.length || 0}</p>
            </div>
          </div>

          {/* Tickets de Suporte */}
          {supportTickets && supportTickets.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-orange-400" />
                Tickets de Suporte
              </h4>
              <div className="space-y-2">
                {supportTickets.slice(0, 5).map((ticket: any) => (
                  <div 
                    key={ticket.id}
                    className="p-3 rounded-lg bg-background/50 border border-border/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{ticket.subject || ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {getTicketStatusBadge(ticket.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimas Notificações */}
          {notifications && notifications.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-400" />
                Últimas Notificações
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notifications.slice(0, 5).map((notif: any) => (
                  <div 
                    key={notif.id}
                    className={`p-3 rounded-lg border flex items-start gap-3 ${
                      notif.read 
                        ? 'bg-background/30 border-border/30' 
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    {notif.read ? (
                      <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notif.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contato do Aluno */}
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <h4 className="text-sm font-medium text-foreground mb-3">Canais de Contato</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{alunoEmail}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </FuturisticCard>
  );
}
