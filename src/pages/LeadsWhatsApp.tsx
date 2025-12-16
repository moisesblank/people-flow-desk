import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface Lead {
  id: string;
  external_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  status: string;
  last_contact: string;
  last_message: string | null;
  last_ai_response: string | null;
  contact_count: number;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationMessage {
  id: string;
  user_message: string;
  ai_response: string;
  processed_by: string;
  created_at: string;
}

const statusConfig = {
  novo: { label: "Novo", color: "bg-blue-500", icon: AlertCircle },
  contatado: { label: "Contatado", color: "bg-yellow-500", icon: Clock },
  interessado: { label: "Interessado", color: "bg-orange-500", icon: Star },
  matriculado: { label: "Matriculado", color: "bg-green-500", icon: CheckCircle },
  perdido: { label: "Perdido", color: "bg-gray-500", icon: XCircle },
};

export default function LeadsWhatsApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isOwner, isAdmin, isLoading: roleLoading } = useAdminCheck();

  // Fetch leads
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_leads')
        .select('*')
        .order('last_contact', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch conversation history
  const fetchHistory = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversation_history')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Erro ao carregar histórico');
    }
  };

  // Update lead status
  const updateStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;
      
      toast.success('Status atualizado!');
      fetchLeads();
      
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Filter leads
  useEffect(() => {
    let result = leads;

    if (searchTerm) {
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          lead.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(result);
  }, [leads, searchTerm, statusFilter]);

  // Initial fetch
  useEffect(() => {
    if (!roleLoading && (isOwner || isAdmin)) {
      fetchLeads();
    }
  }, [roleLoading, isOwner, isAdmin]);

  // Open lead details
  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDialogOpen(true);
    fetchHistory(lead.id);
  };

  // Count by status
  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      novo: 0,
      contatado: 0,
      interessado: 0,
      matriculado: 0,
      perdido: 0,
    };
    leads.forEach((lead) => {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });
    return counts;
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isOwner && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <XCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Apenas Owner e Admin podem acessar esta página.</p>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-green-500" />
            Leads do WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os leads capturados via WhatsApp + IA TRAMON
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total de Leads</p>
            <p className="text-3xl font-bold text-primary">{leads.length}</p>
          </div>
          <Button onClick={fetchLeads} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <Card 
              key={status} 
              className={`cursor-pointer transition-all hover:scale-105 ${
                statusFilter === status ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts[status]}</div>
                <div className={`h-2 ${config.color} rounded-full mt-2`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Nenhum lead encontrado</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros de busca'
              : 'Os leads capturados pelo WhatsApp aparecerão aqui'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const config = statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.novo;
            const Icon = config.icon;
            
            return (
              <Card
                key={lead.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => openLeadDetails(lead)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {lead.name}
                    </span>
                    <Badge className={`${config.color} text-white`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(lead.last_contact), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{lead.contact_count} contatos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="truncate">{lead.source}</span>
                  </div>
                  {lead.last_message && (
                    <p className="text-sm mt-2 line-clamp-2 italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                      "{lead.last_message}"
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lead Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedLead?.name}
              </span>
              {selectedLead && (
                <Badge className={`${statusConfig[selectedLead.status as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white`}>
                  {statusConfig[selectedLead.status as keyof typeof statusConfig]?.label || selectedLead.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Lead Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Telefone</p>
              <p className="text-sm flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {selectedLead?.phone}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Email</p>
              <p className="text-sm">{selectedLead?.email || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Primeiro Contato</p>
              <p className="text-sm">
                {selectedLead?.created_at &&
                  format(new Date(selectedLead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total de Contatos</p>
              <p className="text-sm font-bold">{selectedLead?.contact_count}</p>
            </div>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-hidden">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Histórico da Conversa
            </h3>
            <ScrollArea className="h-[300px] pr-4 border rounded-lg p-4">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conversa registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            👤 Lead
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <p className="text-sm">{msg.user_message}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border-l-4 border-green-500">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                          🤖 TRAMON (IA)
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.ai_response}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              onClick={() => selectedLead && updateStatus(selectedLead.id, "contatado")}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-1" />
              Contatado
            </Button>
            <Button
              onClick={() => selectedLead && updateStatus(selectedLead.id, "interessado")}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Star className="h-4 w-4 mr-1" />
              Interessado
            </Button>
            <Button
              onClick={() => selectedLead && updateStatus(selectedLead.id, "matriculado")}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Matriculado
            </Button>
            <Button
              onClick={() => selectedLead && updateStatus(selectedLead.id, "perdido")}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Perdido
            </Button>
          </div>

          {/* WhatsApp Link */}
          {selectedLead && (
            <div className="pt-2">
              <a
                href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Conversa no WhatsApp
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
