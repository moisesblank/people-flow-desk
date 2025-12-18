import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Download,
  Filter,
  Eye,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transacao {
  id: string;
  transaction_id: string;
  product_id: string | null;
  product_name: string | null;
  buyer_email: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  status: string;
  valor_bruto: number | null;
  metodo_pagamento: string | null;
  parcelas: number | null;
  affiliate_name: string | null;
  data_compra: string | null;
  data_confirmacao: string | null;
  data_cancelamento: string | null;
  created_at: string;
  webhook_raw: unknown;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  approved: { color: "bg-green-500/10 text-green-500 border-green-500/30", icon: <CheckCircle className="h-4 w-4" />, label: "Aprovado" },
  purchase_approved: { color: "bg-green-500/10 text-green-500 border-green-500/30", icon: <CheckCircle className="h-4 w-4" />, label: "Aprovado" },
  purchase_complete: { color: "bg-green-500/10 text-green-500 border-green-500/30", icon: <CheckCircle className="h-4 w-4" />, label: "Completo" },
  canceled: { color: "bg-red-500/10 text-red-500 border-red-500/30", icon: <XCircle className="h-4 w-4" />, label: "Cancelado" },
  purchase_canceled: { color: "bg-red-500/10 text-red-500 border-red-500/30", icon: <XCircle className="h-4 w-4" />, label: "Cancelado" },
  refunded: { color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: <AlertCircle className="h-4 w-4" />, label: "Reembolsado" },
  purchase_refunded: { color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: <AlertCircle className="h-4 w-4" />, label: "Reembolsado" },
  chargeback: { color: "bg-red-500/10 text-red-500 border-red-500/30", icon: <XCircle className="h-4 w-4" />, label: "Chargeback" },
  pending: { color: "bg-amber-500/10 text-amber-500 border-amber-500/30", icon: <Clock className="h-4 w-4" />, label: "Pendente" },
};

export default function TransacoesHotmart() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null);
  const { toast } = useToast();

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    aprovadas: 0,
    canceladas: 0,
    receitaTotal: 0,
    receitaMes: 0
  });

  useEffect(() => {
    fetchTransacoes();
    
    // Realtime subscription
    const channel = supabase
      .channel("transacoes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transacoes_hotmart_completo" },
        () => fetchTransacoes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransacoes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transacoes_hotmart_completo")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      setTransacoes(data || []);

      // Calcular stats
      const aprovadas = data?.filter(t => 
        ["approved", "purchase_approved", "purchase_complete"].includes(t.status?.toLowerCase() || "")
      ) || [];
      
      const canceladas = data?.filter(t => 
        ["canceled", "purchase_canceled", "refunded", "purchase_refunded", "chargeback"].includes(t.status?.toLowerCase() || "")
      ) || [];

      const receitaTotal = aprovadas.reduce((sum, t) => sum + (t.valor_bruto || 0), 0);

      // Receita do mês atual
      const mesAtual = new Date();
      mesAtual.setDate(1);
      mesAtual.setHours(0, 0, 0, 0);
      
      const receitaMes = aprovadas
        .filter(t => new Date(t.created_at) >= mesAtual)
        .reduce((sum, t) => sum + (t.valor_bruto || 0), 0);

      setStats({
        total: data?.length || 0,
        aprovadas: aprovadas.length,
        canceladas: canceladas.length,
        receitaTotal,
        receitaMes
      });

    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransacoes = transacoes.filter(t => {
    const matchesSearch = 
      (t.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || t.status?.toLowerCase().includes(statusFilter);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    const statusLower = status?.toLowerCase() || "pending";
    const config = statusConfig[statusLower] || statusConfig.pending;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <FuturisticPageHeader
        title="Transações Hotmart"
        subtitle="Acompanhamento completo de todas as transações"
        icon={CreditCard}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transações</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold text-green-500">{stats.aprovadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold text-red-500">{stats.canceladas}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.receitaTotal)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Mês</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.receitaMes)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchTransacoes} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email, nome ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
                <SelectItem value="refunded">Reembolsados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Lista de Transações ({filteredTransacoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>ID Transação</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Afiliado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransacoes.map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(transacao.data_compra || transacao.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {transacao.transaction_id?.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transacao.buyer_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{transacao.buyer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {transacao.product_name || "Curso"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transacao.valor_bruto)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transacao.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transacao.affiliate_name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransacao(transacao)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Detalhes da Transação
                            </DialogTitle>
                          </DialogHeader>
                          {selectedTransacao && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">ID Transação</h4>
                                  <p className="font-mono text-sm">{selectedTransacao.transaction_id}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                  {getStatusBadge(selectedTransacao.status)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Comprador</h4>
                                  <p>{selectedTransacao.buyer_name}</p>
                                  <p className="text-sm text-muted-foreground">{selectedTransacao.buyer_email}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Telefone</h4>
                                  <p>{selectedTransacao.buyer_phone || "N/A"}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Produto</h4>
                                  <p>{selectedTransacao.product_name || "Curso"}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Valor</h4>
                                  <p className="text-lg font-bold">{formatCurrency(selectedTransacao.valor_bruto)}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Pagamento</h4>
                                  <p>{selectedTransacao.metodo_pagamento || "N/A"} - {selectedTransacao.parcelas}x</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Afiliado</h4>
                                  <p>{selectedTransacao.affiliate_name || "Nenhum"}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Data Compra</h4>
                                  <p>{formatDate(selectedTransacao.data_compra)}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Data Confirmação</h4>
                                  <p>{formatDate(selectedTransacao.data_confirmacao)}</p>
                                </div>
                              </div>
                              
                              {selectedTransacao.webhook_raw && (
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Payload Raw</h4>
                                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                                    {JSON.stringify(selectedTransacao.webhook_raw, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
